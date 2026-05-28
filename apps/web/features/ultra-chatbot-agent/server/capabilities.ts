export interface UltraChatbotAgentCapabilities {
  sandboxEnabled: boolean;
}

export function getUltraChatbotAgentDefaultCapabilities(): UltraChatbotAgentCapabilities {
  return {
    sandboxEnabled: false,
  };
}

export function normalizeUltraChatbotAgentCapabilities(
  input: unknown
): UltraChatbotAgentCapabilities {
  const defaults = getUltraChatbotAgentDefaultCapabilities();

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return defaults;
  }

  return {
    sandboxEnabled:
      "sandboxEnabled" in input &&
      typeof input.sandboxEnabled === "boolean"
        ? input.sandboxEnabled
        : defaults.sandboxEnabled,
  };
}
