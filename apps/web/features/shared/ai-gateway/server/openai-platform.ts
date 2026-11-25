import { createOpenAI } from "@ai-sdk/openai";
import type {
  createGateway,
  EmbeddingModel,
  ImageModel,
  LanguageModel,
} from "ai";

type Gateway = ReturnType<typeof createGateway>;

export interface DemoModelProvider {
  embeddingModel(modelId: string): Exclude<EmbeddingModel, string>;
  imageModel(modelId: string): Exclude<ImageModel, string>;
  languageModel(modelId: string): Exclude<LanguageModel, string>;
  (modelId: string): Exclude<LanguageModel, string>;
}

export const OPENAI_BASE_URL = "https://api.openai.com/v1";

export function openAIModelId(modelId: string) {
  return modelId.startsWith("openai/") ? modelId.slice("openai/".length) : null;
}

export function createOpenAIPlatform(apiKey?: string) {
  return apiKey?.trim()
    ? createOpenAI({ apiKey: apiKey.trim(), baseURL: OPENAI_BASE_URL })
    : undefined;
}

export function withOpenAIPlatform(
  gateway: Gateway,
  apiKey?: string
): DemoModelProvider {
  const openai = createOpenAIPlatform(apiKey);
  if (!openai) {
    return gateway;
  }

  const languageModel = (modelId: string) => {
    const directId = openAIModelId(modelId);
    return directId
      ? openai.responses(directId)
      : gateway.languageModel(modelId);
  };

  return Object.assign(languageModel, {
    embeddingModel(modelId: string) {
      const directId = openAIModelId(modelId);
      return directId
        ? openai.embedding(directId)
        : gateway.embeddingModel(modelId);
    },
    imageModel(modelId: string) {
      const directId = openAIModelId(modelId);
      return directId ? openai.image(directId) : gateway.imageModel(modelId);
    },
    languageModel,
  });
}
