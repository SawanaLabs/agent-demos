import { getTraceEvalAgentAppEnv } from "./env-source";
import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";
import {
  DEFAULT_TRACE_EVAL_AGENT_CHAT_MODEL,
  resolveTraceEvalAgentChatModel,
} from "./model";

export const DEFAULT_CHAT_MODEL = DEFAULT_TRACE_EVAL_AGENT_CHAT_MODEL;

export type TraceEvalAgentEnv = AiGatewayEnvRecord;

export interface TraceEvalAgentConfig extends AiGatewayContractConfig {}

export interface TraceEvalAgentSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {}

export type TraceEvalAgentGateway = ReturnType<typeof createAiGatewayFromContract>;

const traceEvalAgentContract = {
  defaultChatModel: DEFAULT_CHAT_MODEL,
  missingApiKeyError: "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the trace eval agent.",
  missingApiKeyIssue: "AI_GATEWAY_API_KEY is missing. The demo can render, but trace and eval requests will fail until it is configured.",
} as const;

export function getTraceEvalAgentEnv(): TraceEvalAgentEnv {
  return getTraceEvalAgentAppEnv();
}

export function getTraceEvalAgentConfig(
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): TraceEvalAgentConfig {
  return {
    ...readAiGatewayContractConfig(env, traceEvalAgentContract),
    chatModel: resolveTraceEvalAgentChatModel(env),
  };
}

export function getTraceEvalAgentSetupState(
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): TraceEvalAgentSetupState {
  return buildAiGatewayContractSetupState(env, {
    ...traceEvalAgentContract,
    buildConfig: (resolvedEnv) => ({
      baseURL: resolvedEnv.baseURL,
      chatModel: resolveTraceEvalAgentChatModel(env),
    }),
  });
}

export function createTraceEvalAgentGateway(
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): TraceEvalAgentGateway {
  return createAiGatewayFromContract(env, traceEvalAgentContract);
}
