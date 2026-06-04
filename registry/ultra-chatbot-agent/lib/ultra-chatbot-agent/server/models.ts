export interface UltraChatbotAgentModel {
  capabilities: {
    artifactTooling: boolean;
    attachments: {
      images: boolean;
      pdfs: boolean;
    };
    reasoning: boolean;
    tools: boolean;
    vision: boolean;
  };
  costProfile: "low" | "medium" | "high";
  description: string;
  expectedLatency: "low" | "medium" | "high";
  id: string;
  name: string;
  provider: "deepseek" | "openai";
}

const ultraChatbotAgentModels = [
  {
    capabilities: {
      artifactTooling: true,
      attachments: {
        images: true,
        pdfs: true,
      },
      reasoning: false,
      tools: true,
      vision: true,
    },
    costProfile: "low",
    description: "Fast baseline model for the main chat path.",
    expectedLatency: "low",
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 mini",
    provider: "openai",
  },
  {
    capabilities: {
      artifactTooling: true,
      attachments: {
        images: true,
        pdfs: true,
      },
      reasoning: true,
      tools: true,
      vision: true,
    },
    costProfile: "medium",
    description: "Compact reasoning model for longer agent turns.",
    expectedLatency: "medium",
    id: "openai/gpt-5-mini",
    name: "GPT-5 mini",
    provider: "openai",
  },
  {
    capabilities: {
      artifactTooling: true,
      attachments: {
        images: true,
        pdfs: true,
      },
      reasoning: false,
      tools: true,
      vision: true,
    },
    costProfile: "low",
    description: "Fast DeepSeek chat profile.",
    expectedLatency: "low",
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
  },
  {
    capabilities: {
      artifactTooling: true,
      attachments: {
        images: true,
        pdfs: true,
      },
      reasoning: true,
      tools: true,
      vision: true,
    },
    costProfile: "medium",
    description: "Reasoning-oriented DeepSeek profile.",
    expectedLatency: "medium",
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
