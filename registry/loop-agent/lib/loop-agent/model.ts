import {
  DEFAULT_LOOP_AGENT_CHAT_MODEL,
  getLoopAgentEnv,
  type LoopAgentEnv,
} from "./env";

export const LOOP_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "medium",
    reasoningSummary: "auto",
  },
} as const;

export function resolveLoopAgentChatModel(
  env: LoopAgentEnv = getLoopAgentEnv()
): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_LOOP_AGENT_CHAT_MODEL;
}
