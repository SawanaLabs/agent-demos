import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getFoundationChatAppEnv } from "./env-source";

export const DEFAULT_FOUNDATION_CHAT_MODEL = "openai/gpt-4.1-mini";

export type FoundationChatEnv = AiGatewayEnvRecord;

export interface FoundationChatConfig extends AiGatewayContractConfig {}

export interface FoundationChatSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {}

export type FoundationChatGateway = ReturnType<
  typeof createAiGatewayFromContract
>;

const foundationChatContract = {
  defaultChatModel: DEFAULT_FOUNDATION_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using foundation chat.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function readFoundationChatEnv(): FoundationChatEnv {
  return getFoundationChatAppEnv();
}

export function getFoundationChatConfig(
  env: FoundationChatEnv = readFoundationChatEnv()
): FoundationChatConfig {
  return readAiGatewayContractConfig(env, foundationChatContract);
}

export function getFoundationChatSetupState(
  env: FoundationChatEnv = readFoundationChatEnv()
): FoundationChatSetupState {
  return buildAiGatewayContractSetupState(env, foundationChatContract);
}

export function createFoundationChatGateway(
  env: FoundationChatEnv = readFoundationChatEnv()
): FoundationChatGateway {
  return createAiGatewayFromContract(env, foundationChatContract);
}
