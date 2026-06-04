import { getStreamingChatShellAppEnv } from "./env-source";
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

export type StreamingChatShellEnv = AiGatewayEnvRecord;

export type StreamingChatShellConfig = AiGatewayContractConfig;

export type StreamingChatShellSetupState = AiGatewayContractSetupState<AiGatewaySetupConfig>;

export type StreamingChatShellGateway = ReturnType<typeof createAiGatewayFromContract>;

const streamingChatShellContract = {
  defaultChatModel: DEFAULT_CHAT_MODEL,
  missingApiKeyError: "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the streaming chat shell.",
  missingApiKeyIssue: "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getStreamingChatShellEnv(): StreamingChatShellEnv {
  return getStreamingChatShellAppEnv();
}

export function getStreamingChatShellConfig(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
): StreamingChatShellConfig {
  return readAiGatewayContractConfig(env, streamingChatShellContract);
}

export function getStreamingChatShellSetupState(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
): StreamingChatShellSetupState {
  return buildAiGatewayContractSetupState(env, streamingChatShellContract);
}

export function createStreamingChatShellGateway(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
): StreamingChatShellGateway {
  return createAiGatewayFromContract(env, streamingChatShellContract);
}
