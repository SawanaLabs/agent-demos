import { getMultimodalChatbotAppEnv } from "./env-source";
import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";

export const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";

export type MultimodalChatbotEnv = AiGatewayEnvRecord;

export type MultimodalChatbotConfig = AiGatewayContractConfig;

export type MultimodalChatbotSetupState = AiGatewayContractSetupState<AiGatewaySetupConfig>;

export type MultimodalChatbotGateway = ReturnType<typeof createAiGatewayFromContract>;

const multimodalChatbotContract = {
  defaultChatModel: DEFAULT_CHAT_MODEL,
  missingApiKeyError: "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the multimodal chatbot.",
  missingApiKeyIssue: "AI_GATEWAY_API_KEY is missing. The demo can render, but multimodal chat requests will fail until it is configured.",
} as const;

export function getMultimodalChatbotEnv(): MultimodalChatbotEnv {
  return getMultimodalChatbotAppEnv();
}

export function getMultimodalChatbotConfig(
  env: MultimodalChatbotEnv = getMultimodalChatbotEnv()
): MultimodalChatbotConfig {
  return readAiGatewayContractConfig(env, multimodalChatbotContract);
}

export function getMultimodalChatbotSetupState(
  env: MultimodalChatbotEnv = getMultimodalChatbotEnv()
): MultimodalChatbotSetupState {
  return buildAiGatewayContractSetupState(env, multimodalChatbotContract);
}

export function createMultimodalChatbotGateway(
  env: MultimodalChatbotEnv = getMultimodalChatbotEnv()
): MultimodalChatbotGateway {
  return createAiGatewayFromContract(env, multimodalChatbotContract);
}
