import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getMcpAgentAppEnv } from "./env-source";

export const DEFAULT_MCP_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export type McpAgentEnv = AiGatewayEnvRecord;

export type McpAgentConfig = AiGatewayContractConfig;

export type McpAgentSetupState =
  AiGatewayContractSetupState<AiGatewaySetupConfig>;

export type McpAgentGateway = ReturnType<typeof createAiGatewayFromContract>;

const mcpAgentContract = {
  defaultChatModel: DEFAULT_MCP_AGENT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the MCP agent.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but MCP agent chat requests will fail until it is configured.",
} as const;

export function getMcpAgentEnv(): McpAgentEnv {
  return getMcpAgentAppEnv();
}

export function getMcpAgentConfig(
  env: McpAgentEnv = getMcpAgentEnv()
): McpAgentConfig {
  return readAiGatewayContractConfig(env, mcpAgentContract);
}

export function getMcpAgentSetupState(
  env: McpAgentEnv = getMcpAgentEnv()
): McpAgentSetupState {
  return buildAiGatewayContractSetupState(env, mcpAgentContract);
}

export function createMcpAgentGateway(
  env: McpAgentEnv = getMcpAgentEnv()
): McpAgentGateway {
  return createAiGatewayFromContract(env, mcpAgentContract);
}
