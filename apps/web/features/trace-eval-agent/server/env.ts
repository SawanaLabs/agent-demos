import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getTraceEvalAgentAppEnv } from "./env-source";

export const DEFAULT_CHAT_MODEL = "openai/gpt-5-mini";

export type TraceEvalAgentEnv = AiGatewayEnvRecord;

export interface TraceEvalAgentConfig extends AiGatewayContractConfig {}

export interface TraceEvalAgentSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {}

export type TraceEvalAgentGateway = ReturnType<
  typeof createAiGatewayFromContract
>;

const traceEvalAgentContract = {
  defaultChatModel: DEFAULT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the trace eval agent.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but trace and eval requests will fail until it is configured.",
} as const;

export function getTraceEvalAgentEnv(): TraceEvalAgentEnv {
  return getTraceEvalAgentAppEnv();
}

export function getTraceEvalAgentConfig(
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): TraceEvalAgentConfig {
  return readAiGatewayContractConfig(env, traceEvalAgentContract);
}

export function getTraceEvalAgentSetupState(
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): TraceEvalAgentSetupState {
  return buildAiGatewayContractSetupState(env, traceEvalAgentContract);
}

export function createTraceEvalAgentGateway(
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): TraceEvalAgentGateway {
  return createAiGatewayFromContract(env, traceEvalAgentContract);
}
