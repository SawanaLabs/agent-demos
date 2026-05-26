import { createAiGateway, getAiGatewayConfig } from "@/features/shared/ai-gateway/server/env";

import {
  getUltraChatbotAgentDefaultModel,
  isUltraChatbotAgentModelId,
} from "./models";

type DemoEnv = Record<string, string | undefined>;

export interface UltraChatbotAgentProvider {
  gateway: ReturnType<typeof createAiGateway>;
  resolveModelId: (selectedChatModel?: string) => string;
}

export const ULTRA_CHATBOT_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
  },
} as const;

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

  return {
    gateway,
    resolveModelId(selectedChatModel?: string) {
      return resolveUltraChatbotAgentSelectedModelId({
        env,
        selectedChatModel,
      });
    },
  };
}
