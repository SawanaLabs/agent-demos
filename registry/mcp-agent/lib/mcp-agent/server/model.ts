import { getMcpAgentEnv } from "./env";

const DEFAULT_MCP_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export const MCP_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
  },
} as const;

type McpAgentEnv = Record<string, string | undefined>;

export function resolveMcpAgentChatModel(
  env: McpAgentEnv = getMcpAgentEnv()
): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_MCP_AGENT_CHAT_MODEL;
}
