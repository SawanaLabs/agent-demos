const DEFAULT_SKILLS_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export const SKILLS_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
  },
} as const;

type SkillsAgentEnv = Record<string, string | undefined>;

export function resolveSkillsAgentChatModel(
  env: SkillsAgentEnv = process.env
): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_SKILLS_AGENT_CHAT_MODEL;
}
