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

function getModelName(modelId: string): string {
  return modelId.split("/").at(-1)?.toLowerCase() ?? modelId.toLowerCase();
}

export function supportsLoopAgentReasoningOptions(modelId: string): boolean {
  const modelName = getModelName(modelId);

  return (
    modelName.startsWith("gpt-5") ||
    modelName.startsWith("o1") ||
    modelName.startsWith("o3") ||
    modelName.startsWith("o4")
  );
}

export function resolveLoopAgentProviderOptions(modelId: string) {
  return supportsLoopAgentReasoningOptions(modelId)
    ? LOOP_AGENT_PROVIDER_OPTIONS
    : undefined;
}

export function resolveLoopAgentChatModel(
  env: LoopAgentEnv = getLoopAgentEnv()
): string {
  return env.AI_GATEWAY_CHAT_MODEL || DEFAULT_LOOP_AGENT_CHAT_MODEL;
}
