const DEFAULT_TRACE_EVAL_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export const TRACE_EVAL_SEARCH_TOOL_NAME = "web_search";

export const TRACE_EVAL_AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "low",
    reasoningSummary: "auto",
    textVerbosity: "low",
  },
} as const;

type TraceEvalAgentEnv = Record<string, string | undefined>;

export function resolveTraceEvalAgentChatModel(
  env: TraceEvalAgentEnv = {}
): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_TRACE_EVAL_AGENT_CHAT_MODEL;
}
