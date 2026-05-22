import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import {
  createAiGateway,
  getAiGatewayConfig,
} from "@/features/shared/ai-gateway/server/env";

import type { StreamingAudience } from "./contract";

type DemoEnv = Record<string, string | undefined>;

export type StreamingChatShellEvent =
  | { type: "start"; audience: StreamingAudience }
  | { type: "text"; text: string }
  | { type: "finish"; finishReason: string }
  | { type: "error"; message: string };

function buildAudienceSystemPrompt(audience: StreamingAudience) {
  switch (audience) {
    case "buyers":
      return "You are a concise product explainer for technical buyers. Keep the answer business-legible and concrete.";
    case "support":
      return "You are a support-oriented assistant. Focus on action steps, constraints, and what to try next.";
    case "engineers":
    default:
      return "You are a concise engineering assistant. Keep answers direct, implementation-aware, and explicit about assumptions.";
  }
}

async function createStreamingTurnResult(
  messages: UIMessage[],
  env: DemoEnv,
  audience: StreamingAudience
) {
  const gateway = createAiGateway(env);
  const { chatModel } = getAiGatewayConfig(env);

  return streamText({
    model: gateway(chatModel),
    system: buildAudienceSystemPrompt(audience),
    messages: await convertToModelMessages(messages),
  });
}

function formatStreamingTurnEvent(event: StreamingChatShellEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function createStreamingTurnUiMessageResponse(
  messages: UIMessage[],
  env: DemoEnv,
  audience: StreamingAudience
) {
  const result = await createStreamingTurnResult(messages, env, audience);

  return result.toUIMessageStreamResponse();
}

export async function* streamStreamingTurnEvents(
  messages: UIMessage[],
  env: DemoEnv,
  audience: StreamingAudience
): AsyncIterable<StreamingChatShellEvent> {
  const result = await createStreamingTurnResult(messages, env, audience);

  yield { type: "start", audience };

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

export async function createStreamingTurnEventsResponse(
  messages: UIMessage[],
  env: DemoEnv,
  audience: StreamingAudience
) {
  const encoder = new TextEncoder();
  const eventStream = streamStreamingTurnEvents(messages, env, audience);

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const event of eventStream) {
          controller.enqueue(encoder.encode(formatStreamingTurnEvent(event)));
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
}
