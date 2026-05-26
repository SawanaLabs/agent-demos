export interface UltraChatbotAgentModel {
  capabilities: {
    reasoning: boolean;
    tools: boolean;
    vision: boolean;
  };
  description: string;
  id: string;
  name: string;
  provider: "deepseek" | "openai";
}

const ultraChatbotAgentModels = [
  {
    capabilities: {
      reasoning: false,
      tools: true,
      vision: true,
    },
    description: "Fast baseline model for the main chat path.",
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 mini",
    provider: "openai",
  },
  {
    capabilities: {
      reasoning: true,
      tools: true,
      vision: true,
    },
    description: "Compact reasoning model for longer agent turns.",
    id: "openai/gpt-5-mini",
    name: "GPT-5 mini",
    provider: "openai",
  },
  {
    capabilities: {
      reasoning: false,
      tools: true,
      vision: true,
    },
    description: "Fast DeepSeek chat profile.",
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
  },
  {
    capabilities: {
      reasoning: true,
      tools: true,
      vision: true,
    },
    description: "Reasoning-oriented DeepSeek profile.",
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "deepseek",
  },
] satisfies readonly UltraChatbotAgentModel[];

const ultraChatbotAgentModelIdSet = new Set(
  ultraChatbotAgentModels.map((model) => model.id)
);

const defaultUltraChatbotAgentModelId = "openai/gpt-4.1-mini";

export function getUltraChatbotAgentModelCatalog() {
  return [...ultraChatbotAgentModels];
}

export function getUltraChatbotAgentDefaultModel() {
  return defaultUltraChatbotAgentModelId;
}

export function isUltraChatbotAgentModelId(value: string) {
  return ultraChatbotAgentModelIdSet.has(value);
}

export function resolveUltraChatbotAgentDefaultModel(
  candidate: string | undefined
) {
  if (candidate && isUltraChatbotAgentModelId(candidate)) {
    return candidate;
  }

  return getUltraChatbotAgentDefaultModel();
}
