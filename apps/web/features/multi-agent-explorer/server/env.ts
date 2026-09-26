import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getMultiAgentExplorerAppEnv } from "./env-source";

export const DEFAULT_MULTI_AGENT_EXPLORER_MODEL = "openai/gpt-5-mini";

export type MultiAgentExplorerEnv = AiGatewayEnvRecord;
export type MultiAgentExplorerConfig = AiGatewayContractConfig;
export type MultiAgentExplorerSetupState =
  AiGatewayContractSetupState<AiGatewaySetupConfig>;
export type MultiAgentExplorerGateway = ReturnType<
  typeof createAiGatewayFromContract
>;

const multiAgentExplorerContract = {
  defaultChatModel: DEFAULT_MULTI_AGENT_EXPLORER_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using Multi-Agent Explorer.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getMultiAgentExplorerEnv(): MultiAgentExplorerEnv {
  return getMultiAgentExplorerAppEnv();
}

export function getMultiAgentExplorerConfig(
  env: MultiAgentExplorerEnv = getMultiAgentExplorerEnv()
): MultiAgentExplorerConfig {
  return readAiGatewayContractConfig(env, multiAgentExplorerContract);
}

export function getMultiAgentExplorerSetupState(
  env: MultiAgentExplorerEnv = getMultiAgentExplorerEnv()
): MultiAgentExplorerSetupState {
  return buildAiGatewayContractSetupState(env, multiAgentExplorerContract);
}

export function createMultiAgentExplorerGateway(
  env: MultiAgentExplorerEnv = getMultiAgentExplorerEnv()
): MultiAgentExplorerGateway {
  return createAiGatewayFromContract(env, multiAgentExplorerContract);
}
