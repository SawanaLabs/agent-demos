import { createOpenAI } from "@ai-sdk/openai";

import {
  createAiGateway,
  getAiGatewayConfig,
} from "@/features/shared/ai-gateway/server/env";

import {
  getUltraChatbotAgentDefaultModel,
  isUltraChatbotAgentModelId,
} from "./models";

type DemoEnv = Record<string, string | undefined>;

export interface UltraChatbotAgentProvider {
  gateway: ReturnType<typeof createAiGateway>;
  hostedToolsGateway: ReturnType<typeof createOpenAI>;
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

  const { chatModel } = getAiGatewayConfig(input.env);

  if (isUltraChatbotAgentModelId(chatModel)) {
    return chatModel;
  }

  return getUltraChatbotAgentDefaultModel();
}

export function createUltraChatbotAgentProvider(
  env: DemoEnv
): UltraChatbotAgentProvider {
  const gateway = createAiGateway(env);
  const { apiKey, baseURL } = getAiGatewayConfig(env);
  const hostedToolsGateway = createOpenAI({
    apiKey,
    baseURL: resolveOpenAICompatibleBaseURL(baseURL),
    name: "gateway-openai",
  });

  return {
    gateway,
    hostedToolsGateway,
    resolveModelId(selectedChatModel?: string) {
      return resolveUltraChatbotAgentSelectedModelId({
        env,
        selectedChatModel,
      });
    },
  };
}
