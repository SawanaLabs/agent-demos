const DEFAULT_SANDBOX_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export const SANDBOX_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
  },
} as const;

type SandboxAgentEnv = Record<string, string | undefined>;

export function resolveSandboxAgentChatModel(
  env: SandboxAgentEnv = process.env
): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_SANDBOX_AGENT_CHAT_MODEL;
}
