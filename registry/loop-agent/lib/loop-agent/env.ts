import { getLoopAgentAppEnv } from "./env-source";
import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";

export const DEFAULT_LOOP_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export type LoopAgentEnv = AiGatewayEnvRecord;

export type LoopAgentConfig = AiGatewayContractConfig;

export type LoopAgentSetupState = AiGatewayContractSetupState<AiGatewaySetupConfig>;

export type LoopAgentGateway = ReturnType<typeof createAiGatewayFromContract>;

const loopAgentContract = {
  defaultChatModel: DEFAULT_LOOP_AGENT_CHAT_MODEL,
  missingApiKeyError: "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the loop agent.",
  missingApiKeyIssue: "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getLoopAgentEnv(): LoopAgentEnv {
  return getLoopAgentAppEnv();
}

export function getLoopAgentConfig(
  env: LoopAgentEnv = getLoopAgentEnv()
): LoopAgentConfig {
  return readAiGatewayContractConfig(env, loopAgentContract);
}

export function getLoopAgentSetupState(
  env: LoopAgentEnv = getLoopAgentEnv()
): LoopAgentSetupState {
  return buildAiGatewayContractSetupState(env, loopAgentContract);
}

export function createLoopAgentGateway(
  env: LoopAgentEnv = getLoopAgentEnv()
): LoopAgentGateway {
  return createAiGatewayFromContract(env, loopAgentContract);
}
