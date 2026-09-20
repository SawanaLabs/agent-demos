import { createGateway, type ImageModel, type LanguageModel } from "ai";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_GATEWAY_BASE_URL,
} from "@/features/shared/ai-gateway/server/contract";

export const DEFAULT_CANVAS_TEXT_MODEL = DEFAULT_CHAT_MODEL;
export const CANVAS_TEXT_PROVIDER_OPTIONS = {
  openai: { reasoningEffort: "medium" },
} as const;
export const DEFAULT_CANVAS_IMAGE_MODEL = "openai/gpt-image-2";

export function canvasSetup() {
  return {
    ready: Boolean(
      process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    ),
  };
}
export function canvasModels(): { text: LanguageModel; image: ImageModel } {
  if (!canvasSetup().ready) {
    throw new Error("请配置 AI_GATEWAY_API_KEY 后使用 AI。");
  }
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL: process.env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
  });
  return {
    text: gateway.languageModel(
      process.env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CANVAS_TEXT_MODEL
    ),
    image: gateway.imageModel(
      process.env.AI_GATEWAY_IMAGE_MODEL || DEFAULT_CANVAS_IMAGE_MODEL
    ),
  };
}
