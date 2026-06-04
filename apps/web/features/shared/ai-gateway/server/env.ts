import { env as appEnv } from "@/env";

import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "./contract";
import { DEFAULT_CHAT_MODEL } from "./keys";

export type AiGatewayEnv = AiGatewayEnvRecord;

export type AiGatewayConfig = AiGatewayContractConfig;

export type AiGatewaySetupState = AiGatewayContractSetupState<
  Omit<AiGatewayConfig, "apiKey">
>;

export type AiGatewayProvider = ReturnType<typeof createAiGatewayFromContract>;

const aiGatewayContract = {
  defaultChatModel: DEFAULT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to apps/web/.env.local using the contract in apps/web/.env.example.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getAiGatewayConfig(
  env: AiGatewayEnv = appEnv
): AiGatewayConfig {
  return readAiGatewayContractConfig(env, aiGatewayContract);
}

export function getAiGatewaySetupState(
  env: AiGatewayEnv = appEnv
): AiGatewaySetupState {
  return buildAiGatewayContractSetupState(env, aiGatewayContract);
}

export function createAiGateway(env: AiGatewayEnv = appEnv): AiGatewayProvider {
  return createAiGatewayFromContract(env, aiGatewayContract);
}
