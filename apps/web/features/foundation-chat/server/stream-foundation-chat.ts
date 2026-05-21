import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createAiGateway,
  getAiGatewayConfig,
} from "@/features/shared/ai-gateway/server/env";

const systemPrompt = [
  "You are the foundation chat demo in a production-ready agent demos monorepo.",
  "Keep answers concise, direct, and useful to engineers evaluating the stack.",
  "When a request is ambiguous, surface the assumption clearly and keep moving.",
].join(" ");

export async function streamFoundationChat(messages: UIMessage[]) {
  const gateway = createAiGateway();
  const { chatModel } = getAiGatewayConfig();

  const result = streamText({
    model: gateway(chatModel),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
