export interface ProjectGuideCompanionModel {
  description: string;
  id: string;
  kind: "chat" | "reasoning";
  name: string;
  provider: "openai" | "zai";
}

const projectGuideCompanionModels = [
  {
    description: "Default project-docs companion model.",
    id: "zai/glm-5",
    kind: "chat",
    name: "GLM-5",
    provider: "zai",
  },
  {
    description: "Fast OpenAI mini model for concise project-docs answers.",
    id: "openai/gpt-4.1-mini",
    kind: "chat",
    name: "GPT-4.1 mini",
    provider: "openai",
  },
  {
    description: "Compact OpenAI reasoning model for deeper project questions.",
    id: "openai/gpt-5-mini",
    kind: "reasoning",
    name: "GPT-5 mini",
    provider: "openai",
  },
] as const satisfies readonly ProjectGuideCompanionModel[];

export type ProjectGuideCompanionModelId =
  (typeof projectGuideCompanionModels)[number]["id"];

export const DEFAULT_PROJECT_GUIDE_COMPANION_MODEL =
  "zai/glm-5" satisfies ProjectGuideCompanionModelId;

const projectGuideCompanionModelIdSet = new Set<string>(
  projectGuideCompanionModels.map((model) => model.id)
);

export function getProjectGuideCompanionModelCatalog() {
  return [...projectGuideCompanionModels];
}

export function getProjectGuideCompanionDefaultModel() {
  return DEFAULT_PROJECT_GUIDE_COMPANION_MODEL;
}

export function findProjectGuideCompanionModel(modelId: string) {
  return projectGuideCompanionModels.find((model) => model.id === modelId);
}

export function getProjectGuideCompanionAllowedModelIds() {
  return projectGuideCompanionModels.map((model) => model.id);
}

export function isProjectGuideCompanionModelId(
  value: string
): value is ProjectGuideCompanionModelId {
  return projectGuideCompanionModelIdSet.has(value);
}

export function resolveProjectGuideCompanionModelId(
  candidate: string | undefined
): ProjectGuideCompanionModelId {
  if (!candidate) {
    return DEFAULT_PROJECT_GUIDE_COMPANION_MODEL;
  }

  if (isProjectGuideCompanionModelId(candidate)) {
    return candidate;
  }

  throw new Error(
    `Unsupported project guide companion model "${candidate}". Expected one of: ${getProjectGuideCompanionAllowedModelIds().join(", ")}.`
  );
}
