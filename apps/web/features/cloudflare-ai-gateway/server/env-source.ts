import { z } from "zod";
import { env as appEnv } from "@/env";
import { authModes, imageGateways } from "../contract";

function getGatewayAppEnv() {
  return appEnv;
}

const source = getGatewayAppEnv();
const gateway = z
  .enum(imageGateways)
  .default("cloudflare")
  .parse(source.IMAGE_GATEWAY || undefined);
export const env = {
  IMAGE_GATEWAY: gateway,
  AI_GATEWAY_API_KEY: source.AI_GATEWAY_API_KEY || undefined,
  CLOUDFLARE_ACCOUNT_ID: source.CLOUDFLARE_ACCOUNT_ID || undefined,
  CLOUDFLARE_AI_GATEWAY_ID: source.CLOUDFLARE_AI_GATEWAY_ID || undefined,
  CLOUDFLARE_AI_GATEWAY_TOKEN: source.CLOUDFLARE_AI_GATEWAY_TOKEN || undefined,
  CLOUDFLARE_AI_GATEWAY_AUTH_MODE: z
    .enum(authModes)
    .default("byok")
    .parse(
      gateway === "cloudflare"
        ? source.CLOUDFLARE_AI_GATEWAY_AUTH_MODE || undefined
        : undefined
    ),
  CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS:
    source.CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS || undefined,
  CLOUDFLARE_OPENAI_API_KEY: source.CLOUDFLARE_OPENAI_API_KEY || undefined,
  CLOUDFLARE_GOOGLE_API_KEY: source.CLOUDFLARE_GOOGLE_API_KEY || undefined,
  CLOUDFLARE_API_TOKEN: source.CLOUDFLARE_API_TOKEN || undefined,
};
