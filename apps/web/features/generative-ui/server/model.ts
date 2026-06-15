export const DEFAULT_GENERATIVE_UI_CHAT_MODEL = "openai/gpt-5-mini";
export const GENERATIVE_UI_CHAT_MODEL_ENV_KEY = "GENERATIVE_UI_CHAT_MODEL";

export const GENERATIVE_UI_SEARCH_TOOL_NAME = "web_search";

export const GENERATIVE_UI_PROVIDER_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningSummary: "detailed",
    textVerbosity: "low",
  },
} as const;

type GenerativeUiModelEnv = Record<string, string | undefined>;

export function resolveGenerativeUiChatModel(
  env: GenerativeUiModelEnv = {}
): string {
  return (
    env[GENERATIVE_UI_CHAT_MODEL_ENV_KEY] || DEFAULT_GENERATIVE_UI_CHAT_MODEL
  );
}
