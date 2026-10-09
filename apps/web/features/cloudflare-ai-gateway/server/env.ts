import "server-only";
import {
  type GatewayRequest,
  type GatewaySetup,
  gatewayModels,
} from "../contract";
import type { ImageGeneratorConfig } from "./config";
import { env } from "./env-source";

export function getGatewaySetup(): GatewaySetup {
  if (env.IMAGE_GATEWAY === "vercel") {
    const missing = env.AI_GATEWAY_API_KEY ? [] : ["AI_GATEWAY_API_KEY"];
    return {
      gateway: "vercel",
      authMode: "gateway-managed",
      missing,
      models: gatewayModels.map((id) => ({
        id,
        available: missing.length === 0,
        missing,
      })),
    };
  }
  const required = [
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_AI_GATEWAY_ID",
    "CLOUDFLARE_AI_GATEWAY_TOKEN",
  ] as const;
  const missing = required.filter((key) => !env[key]);
  const authMode = env.CLOUDFLARE_AI_GATEWAY_AUTH_MODE;
  const models = gatewayModels.map((id) => {
    const key =
      id === "gpt-image-2"
        ? "CLOUDFLARE_OPENAI_API_KEY"
        : "CLOUDFLARE_GOOGLE_API_KEY";
    const modelMissing = [
      ...missing,
      ...(authMode === "byok" && !env[key] ? [key] : []),
    ];
    return { id, available: modelMissing.length === 0, missing: modelMissing };
  });
  return { gateway: "cloudflare", authMode, missing, models };
}

export function getImageGeneratorConfig(
  model: GatewayRequest["model"]
): ImageGeneratorConfig {
  if (env.IMAGE_GATEWAY === "vercel") {
    if (!env.AI_GATEWAY_API_KEY) {
      throw new Error("Configure AI_GATEWAY_API_KEY on the server.");
    }
    return { gateway: "vercel", apiKey: env.AI_GATEWAY_API_KEY };
  }
  const setup = getGatewaySetup().models.find((entry) => entry.id === model);
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = env.CLOUDFLARE_AI_GATEWAY_ID;
  const gatewayToken = env.CLOUDFLARE_AI_GATEWAY_TOKEN;
  if (!(setup?.available && accountId && gatewayId && gatewayToken)) {
    throw new Error(`Configure ${setup?.missing.join(", ")} on the server.`);
  }
  return {
    gateway: "cloudflare",
    accountId,
    gatewayId,
    gatewayToken,
    authMode: env.CLOUDFLARE_AI_GATEWAY_AUTH_MODE,
    byokAlias: env.CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS,
    openaiKey: env.CLOUDFLARE_OPENAI_API_KEY,
    googleKey: env.CLOUDFLARE_GOOGLE_API_KEY,
    apiToken: env.CLOUDFLARE_API_TOKEN,
  };
}
