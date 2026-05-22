import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import {
  createAiGateway,
  getAiGatewayConfig,
} from "@/features/shared/ai-gateway/server/env";

import { findRelevantContent } from "./retrieval";

type DemoEnv = Record<string, string | undefined>;

const systemPrompt = [
  "You are the rag-chatbot demo for an independent-site document support agent.",
  "Answer only with information grounded in the indexed document knowledge base.",
  "Use the getInformation tool before answering any question about the document.",
  'If the tool returns no relevant evidence, reply exactly with "Sorry, I don\'t know."',
  "When evidence exists, answer concisely and mention the most relevant document section or page when possible.",
  "Do not turn document guidance into legal, trademark, or commercial authorization claims.",
].join(" ");

export async function streamRagChatbot(
  messages: UIMessage[],
  env: DemoEnv = process.env
) {
  const gateway = createAiGateway(env);
  const { chatModel } = getAiGatewayConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      getInformation: tool({
        description:
          "Retrieve grounded document snippets from the indexed knowledge base to answer the user's question.",
        inputSchema: z.object({
          question: z
            .string()
            .min(1)
            .describe("The user's question about the indexed document."),
        }),
        execute: async ({ question }) => findRelevantContent(question, env),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
