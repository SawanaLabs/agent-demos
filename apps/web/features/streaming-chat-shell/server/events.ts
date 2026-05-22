import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createAiGateway,
  getAiGatewayConfig,
  getAiGatewaySetupState,
} from "@/features/shared/ai-gateway/server/env";

import {
  invalidMessagesError,
  invalidUiMessagesError,
  malformedJsonError,
  readStreamingChatShellRequest,
  type StreamingAudience,
} from "./contract";
import { buildAudienceSystemPrompt } from "./prompt";

type DemoEnv = Record<string, string | undefined>;

export type StreamingChatShellEvent =
  | { type: "start"; audience: StreamingAudience }
  | { type: "text"; text: string }
  | { type: "finish"; finishReason: string }
  | { type: "error"; message: string };

interface StreamingChatShellEventsDependencies {
  streamStreamingChatShellEvents: (
    messages: UIMessage[],
    env: DemoEnv,
    options: { audience: StreamingAudience }
  ) => AsyncIterable<StreamingChatShellEvent>;
}

function formatStreamingChatShellEvent(event: StreamingChatShellEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function* streamStreamingChatShellEvents(
  messages: UIMessage[],
  env: DemoEnv,
  options: { audience: StreamingAudience }
): AsyncIterable<StreamingChatShellEvent> {
  const gateway = createAiGateway(env);
  const { chatModel } = getAiGatewayConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    system: buildAudienceSystemPrompt(options.audience),
    messages: await convertToModelMessages(messages),
  });

  yield { type: "start", audience: options.audience };

  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      yield { type: "text", text: part.text };
      continue;
    }

    if (part.type === "finish") {
      yield { type: "finish", finishReason: part.finishReason };
      return;
    }

    if (part.type === "error") {
      yield {
        type: "error",
        message:
          part.error instanceof Error
            ? part.error.message
            : "Custom stream failed.",
      };
      return;
    }
  }
}

export async function handleStreamingChatShellEventsRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: StreamingChatShellEventsDependencies = {
    streamStreamingChatShellEvents,
  }
) {
  const runtimeState = getAiGatewaySetupState(env);

  if (!runtimeState.isReady) {
    return Response.json(
      {
        error:
          runtimeState.issues.length > 0
            ? runtimeState.issues.join(" ")
            : "AI Gateway setup is required.",
      },
      { status: 500 }
    );
  }

  try {
    const { audience, messages } = await readStreamingChatShellRequest(
      await request.json()
    );
    const encoder = new TextEncoder();
    const eventStream =
      await dependencies.streamStreamingChatShellEvents(messages, env, {
        audience,
      });

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const event of eventStream) {
            controller.enqueue(
              encoder.encode(formatStreamingChatShellEvent(event))
            );
          }

          controller.close();
        },
      }),
      {
        headers: {
          "cache-control": "no-cache",
          "content-type": "text/event-stream; charset=utf-8",
        },
      }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        {
          error: malformedJsonError,
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      [invalidMessagesError, invalidUiMessagesError].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
