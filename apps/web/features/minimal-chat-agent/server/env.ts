import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewayResolvedEnv,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getMinimalChatAgentAppEnv } from "./env-source";

export const DEFAULT_MINIMAL_CHAT_AGENT_MODEL = "openai/gpt-5-mini";
const incompatibleModelIssue =
  "Minimal Chat Agent requires an openai/* AI Gateway model for provider-native web search.";

export type MinimalChatAgentEnv = AiGatewayEnvRecord;
export type MinimalChatAgentConfig = AiGatewayContractConfig;
export type MinimalChatAgentSetupState =
  AiGatewayContractSetupState<AiGatewaySetupConfig>;

const minimalChatAgentContract = {
  defaultChatModel: DEFAULT_MINIMAL_CHAT_AGENT_MODEL,
  getAdditionalIssues: (resolvedEnv: AiGatewayResolvedEnv) =>
    resolvedEnv.chatModel.startsWith("openai/") ? [] : [incompatibleModelIssue],
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using Minimal Chat Agent.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getMinimalChatAgentEnv(): MinimalChatAgentEnv {
  return getMinimalChatAgentAppEnv();
}

export function getMinimalChatAgentConfig(
  env: MinimalChatAgentEnv = getMinimalChatAgentEnv()
): MinimalChatAgentConfig {
  const config = readAiGatewayContractConfig(env, minimalChatAgentContract);

  if (!config.chatModel.startsWith("openai/")) {
    throw new Error(incompatibleModelIssue);
  }

  return config;
}

export function getMinimalChatAgentSetupState(
  env: MinimalChatAgentEnv = getMinimalChatAgentEnv()
): MinimalChatAgentSetupState {
  return buildAiGatewayContractSetupState(env, minimalChatAgentContract);
}
