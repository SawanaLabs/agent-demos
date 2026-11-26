import { createGateway, type ImageModel, type LanguageModel } from "ai";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_GATEWAY_BASE_URL,
} from "@/features/shared/ai-gateway/server/contract";

import {
  hasDemoModelCredentials,
  withOpenAIPlatform,
} from "@/features/shared/ai-gateway/server/openai-platform";

export const DEFAULT_CANVAS_TEXT_MODEL = DEFAULT_CHAT_MODEL;
export const CANVAS_TEXT_PROVIDER_OPTIONS = {
  openai: { reasoningEffort: "medium" },
} as const;
export const DEFAULT_CANVAS_IMAGE_MODEL = "openai/gpt-image-2";

function canvasModelIds() {
  return {
    text: process.env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CANVAS_TEXT_MODEL,
    image: process.env.AI_GATEWAY_IMAGE_MODEL || DEFAULT_CANVAS_IMAGE_MODEL,
  };
}

export function canvasSetup() {
  const { text, image } = canvasModelIds();
  const openaiKey = process.env.OPENAI_API_KEY;
  const gatewayCredential =
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  return {
    ready:
      hasDemoModelCredentials(text, openaiKey, gatewayCredential) &&
      hasDemoModelCredentials(image, openaiKey, gatewayCredential),
  };
}

export function canvasModels(): { text: LanguageModel; image: ImageModel } {
  if (!canvasSetup().ready) {
    throw new Error("请配置 OPENAI_API_KEY 或 AI_GATEWAY_API_KEY 后使用 AI。");
  }
  const provider = withOpenAIPlatform(
    createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: process.env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    }),
    process.env.OPENAI_API_KEY
  );
  const { text, image } = canvasModelIds();
  return {
    text: provider.languageModel(text),
    image: provider.imageModel(image),
  };
}
