import { type UIMessage } from "ai";

import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";

import {
  invalidMessagesError,
  invalidUiMessagesError,
  malformedJsonError,
  readStreamingChatShellRequest,
  type StreamingAudience,
} from "./contract";
import {
  createStreamingTurnEventsResponse,
  streamStreamingTurnEvents,
  type StreamingChatShellEvent,
} from "./streaming-turn";

type DemoEnv = Record<string, string | undefined>;

interface StreamingChatShellEventsDependencies {
  streamStreamingChatShellEvents: (
    messages: UIMessage[],
    env: DemoEnv,
    options: { audience: StreamingAudience }
  ) => AsyncIterable<StreamingChatShellEvent>;
}

export async function* streamStreamingChatShellEvents(
  messages: UIMessage[],
  env: DemoEnv,
  options: { audience: StreamingAudience }
): AsyncIterable<StreamingChatShellEvent> {
  yield* streamStreamingTurnEvents(messages, env, options.audience);
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
    if (dependencies.streamStreamingChatShellEvents === streamStreamingChatShellEvents) {
      return createStreamingTurnEventsResponse(messages, env, audience);
    }

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
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
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
