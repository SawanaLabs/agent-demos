import {
  DEFAULT_SANDBOX_AGENT_CHAT_MODEL,
  getSandboxAgentEnv,
  type SandboxAgentEnv,
} from "./env";

export const SANDBOX_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
  },
} as const;

export function resolveSandboxAgentChatModel(
  env: SandboxAgentEnv = getSandboxAgentEnv()
): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_SANDBOX_AGENT_CHAT_MODEL;
}
