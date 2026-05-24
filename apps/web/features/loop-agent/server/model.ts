import { env as appEnv } from "@/env";

const DEFAULT_LOOP_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export const LOOP_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
  },
} as const;

type LoopAgentEnv = Record<string, string | undefined>;

export function resolveLoopAgentChatModel(env: LoopAgentEnv = appEnv): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_LOOP_AGENT_CHAT_MODEL;
}
