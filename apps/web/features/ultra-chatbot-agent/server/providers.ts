import { createOpenAI } from "@ai-sdk/openai";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_GATEWAY_BASE_URL,
} from "@/features/shared/ai-gateway/server/contract";
import { createAiGateway } from "@/features/shared/ai-gateway/server/env";
import {
  createOpenAIPlatform,
  openAIModelId,
} from "@/features/shared/ai-gateway/server/openai-platform";

import {
  getUltraChatbotAgentDefaultModel,
  isUltraChatbotAgentModelId,
} from "./models";

type DemoEnv = Record<string, string | undefined>;

export interface UltraChatbotAgentProvider {
  gateway: ReturnType<typeof createAiGateway>;
  hostedTools: (modelId: string) => {
    model: ReturnType<ReturnType<typeof createOpenAI>["responses"]>;
    tools: ReturnType<typeof createOpenAI>["tools"];
  };
  resolveModelId: (selectedChatModel?: string) => string;
}

export const ULTRA_CHATBOT_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
    textVerbosity: "low",
  },
} as const;

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
    `Ultra chatbot agent expects AI_GATEWAY_BASE_URL to end with /v3/ai or /v1. Received: ${baseURL}`
  );
}

export function resolveUltraChatbotAgentSelectedModelId(input: {
  env: DemoEnv;
  selectedChatModel?: string;
}) {
  if (
    input.selectedChatModel &&
    isUltraChatbotAgentModelId(input.selectedChatModel)
  ) {
    return input.selectedChatModel;
  }

  const chatModel = input.env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL;

  if (isUltraChatbotAgentModelId(chatModel)) {
    return chatModel;
  }

  return getUltraChatbotAgentDefaultModel();
}

export function createUltraChatbotAgentProvider(
  env: DemoEnv
): UltraChatbotAgentProvider {
  const gateway = createAiGateway(env);

  return {
    gateway,
    hostedTools(modelId: string) {
      const directId = openAIModelId(modelId);
      if (directId !== null) {
        const direct = createOpenAIPlatform(env.OPENAI_API_KEY);
        return { model: direct.responses(directId), tools: direct.tools };
      }

      const apiKey = env.AI_GATEWAY_API_KEY;
      if (!apiKey) {
        throw new Error("Missing AI_GATEWAY_API_KEY for this model.");
      }
      const hostedToolsGateway = createOpenAI({
        apiKey,
        baseURL: resolveOpenAICompatibleBaseURL(
          env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL
        ),
        name: "gateway-openai",
      });
      return {
        model: hostedToolsGateway.responses(modelId),
        tools: hostedToolsGateway.tools,
      };
    },
    resolveModelId(selectedChatModel?: string) {
      return resolveUltraChatbotAgentSelectedModelId({
        env,
        selectedChatModel,
      });
    },
  };
}
