import "server-only";
import {
  type authModes,
  type GatewayRequest,
  type GatewaySetup,
  gatewayModels,
} from "../contract";
import { env } from "./env-source";

export interface CloudflareConfig {
  accountId: string;
  apiToken?: string;
  authMode: (typeof authModes)[number];
  byokAlias?: string;
  gatewayId: string;
  gatewayToken: string;
  googleKey?: string;
  openaiKey?: string;
}

export function getGatewaySetup(): GatewaySetup {
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
  return { authMode, missing, models };
}

export function getCloudflareConfig(
  model: GatewayRequest["model"]
): CloudflareConfig {
  const setup = getGatewaySetup().models.find((entry) => entry.id === model);
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = env.CLOUDFLARE_AI_GATEWAY_ID;
  const gatewayToken = env.CLOUDFLARE_AI_GATEWAY_TOKEN;
  if (!(setup?.available && accountId && gatewayId && gatewayToken)) {
    throw new Error(`Configure ${setup?.missing.join(", ")} on the server.`);
  }
  return {
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
