import { createGateway, type LanguageModel } from "ai";
import { DEFAULT_GATEWAY_BASE_URL } from "@/features/shared/ai-gateway/server/contract";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_IMAGE_MODEL,
} from "@/features/shared/ai-gateway/server/keys";

export function canvasSetup() {
  return {
    ready: Boolean(
      process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    ),
  };
}
export function canvasModels(): { text: LanguageModel; image: LanguageModel } {
  if (!canvasSetup().ready) {
    throw new Error("请配置 AI_GATEWAY_API_KEY 后使用 AI。");
  }
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL: process.env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
  });
  return {
    text: gateway.languageModel(
      process.env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL
    ),
    image: gateway.languageModel(
      process.env.AI_GATEWAY_IMAGE_MODEL || DEFAULT_IMAGE_MODEL
    ),
  };
}
