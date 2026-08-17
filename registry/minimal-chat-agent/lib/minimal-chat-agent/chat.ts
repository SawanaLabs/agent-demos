import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import {
  getMinimalChatAgentConfig,
  getMinimalChatAgentEnv,
  type MinimalChatAgentEnv,
} from "./env";
import { createMinimalChatAgentTools } from "./tools";

const systemPrompt = [
  "You are Minimal Chat Agent, a compact example of a useful tool-aware assistant.",
  "Answer directly when durable reasoning is enough.",
  "Use web_search when current public information materially improves the answer.",
  'Use github_repo for public repository facts after identifying an exact "owner/name" coordinate.',
  "Use ask_user instead of guessing when the request is ambiguous, consequential, or missing preferences needed for a useful recommendation.",
  "After the user answers ask_user, continue the original task using those answers.",
  "Keep questions and final answers concise.",
].join(" ");

const trailingSlashPattern = /\/$/;
const v3AiSuffixPattern = /\/v3\/ai$/;

function resolveOpenAICompatibleBaseURL(baseURL: string) {
  const normalizedBaseURL = baseURL.replace(trailingSlashPattern, "");

  if (normalizedBaseURL.endsWith("/v1")) {
    return normalizedBaseURL;
  }

  if (normalizedBaseURL.endsWith("/v3/ai")) {
    return normalizedBaseURL.replace(v3AiSuffixPattern, "/v1");
  }

  throw new Error(
    `Minimal Chat Agent expects AI_GATEWAY_BASE_URL to end with /v3/ai or /v1. Received: ${baseURL}`
  );
}

export async function streamMinimalChatAgent(
  messages: UIMessage[],
  env: MinimalChatAgentEnv = getMinimalChatAgentEnv(),
  abortSignal?: AbortSignal
) {
  const { apiKey, baseURL, chatModel } = getMinimalChatAgentConfig(env);
  const openai = createOpenAI({
    apiKey,
    baseURL: resolveOpenAICompatibleBaseURL(baseURL),
    name: "gateway-openai",
  });
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const result = streamText({
    abortSignal,
    experimental_telemetry: {
      functionId: "minimal-chat-agent.run",
      isEnabled: true,
      metadata: {
        demo: "minimal-chat-agent",
        runId,
      },
      recordInputs: true,
      recordOutputs: true,
    },
    maxOutputTokens: 4096,
    messages: await convertToModelMessages(messages),
    model: openai(chatModel),
    stopWhen: stepCountIs(5),
    system: systemPrompt,
    tools: createMinimalChatAgentTools(openai.tools),
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return {
          model: chatModel,
          runId,
          startedAt,
        };
      }

      if (part.type === "finish") {
        return {
          finishReason: part.finishReason,
          finishedAt: Date.now(),
          model: chatModel,
          runId,
          startedAt,
          totalUsage: part.totalUsage,
        };
      }

      return;
    },
    onError: () => "Minimal Chat Agent could not complete this turn.",
    originalMessages: messages,
    sendReasoning: true,
    sendSources: true,
  });
}
