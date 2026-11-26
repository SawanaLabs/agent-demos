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
export const MISSING_OPENAI_PLATFORM_KEY =
  "OPENAI_API_KEY is required for OpenAI Platform.";

const nativeOpenAIModelPattern =
  /^(?:gpt-|chatgpt-|o[134](?:-|$)|text-embedding-|dall-e-)/;

export function openAIModelId(modelId: string) {
  if (modelId.startsWith("openai/")) {
    return modelId.slice("openai/".length);
  }
  return !modelId.includes("/") && nativeOpenAIModelPattern.test(modelId)
    ? modelId
    : null;
}

export function hasDemoModelCredentials(
  modelId: string,
  openaiKey: string | undefined,
  gatewayCredential: string | null | undefined
) {
  return Boolean(
    openAIModelId(modelId) === null
      ? gatewayCredential?.trim()
      : openaiKey?.trim()
  );
}

export function requireOpenAIPlatformKey(apiKey?: string) {
  const key = apiKey?.trim();
  if (!key) {
    throw new Error(MISSING_OPENAI_PLATFORM_KEY);
  }
  return key;
}

export function createOpenAIPlatform(apiKey?: string) {
  return createOpenAI({
    apiKey: requireOpenAIPlatformKey(apiKey),
    baseURL: OPENAI_BASE_URL,
  });
}

export function withOpenAIPlatform(
  gateway: Gateway | undefined,
  apiKey?: string,
  missingGatewayCredentials = "Missing AI_GATEWAY_API_KEY for this model."
): DemoModelProvider {
  let openai: ReturnType<typeof createOpenAIPlatform> | undefined;
  function requireOpenAI() {
    openai ??= createOpenAIPlatform(apiKey);
    return openai;
  }

  function requireGateway() {
    if (!gateway) {
      throw new Error(missingGatewayCredentials);
    }

    return gateway;
  }

  const languageModel = (modelId: string) => {
    const directId = openAIModelId(modelId);
    return directId === null
      ? requireGateway().languageModel(modelId)
      : requireOpenAI().responses(directId);
  };

  return Object.assign(languageModel, {
    embeddingModel(modelId: string) {
      const directId = openAIModelId(modelId);
      return directId === null
        ? requireGateway().embeddingModel(modelId)
        : requireOpenAI().embedding(directId);
    },
    imageModel(modelId: string) {
      const directId = openAIModelId(modelId);
      return directId === null
        ? requireGateway().imageModel(modelId)
        : requireOpenAI().image(directId);
    },
    languageModel,
  });
}
