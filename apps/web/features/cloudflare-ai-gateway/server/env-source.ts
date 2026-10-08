import { z } from "zod";
import { env as appEnv } from "@/env";
import { authModes } from "../contract";

function getGatewayAppEnv() {
  return appEnv;
}

const source = getGatewayAppEnv();
export const env = {
  CLOUDFLARE_ACCOUNT_ID: source.CLOUDFLARE_ACCOUNT_ID || undefined,
  CLOUDFLARE_AI_GATEWAY_ID: source.CLOUDFLARE_AI_GATEWAY_ID || undefined,
  CLOUDFLARE_AI_GATEWAY_TOKEN: source.CLOUDFLARE_AI_GATEWAY_TOKEN || undefined,
  CLOUDFLARE_AI_GATEWAY_AUTH_MODE: z
    .enum(authModes)
    .default("byok")
    .parse(source.CLOUDFLARE_AI_GATEWAY_AUTH_MODE || undefined),
  CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS:
    source.CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS || undefined,
  CLOUDFLARE_OPENAI_API_KEY: source.CLOUDFLARE_OPENAI_API_KEY || undefined,
  CLOUDFLARE_GOOGLE_API_KEY: source.CLOUDFLARE_GOOGLE_API_KEY || undefined,
  CLOUDFLARE_API_TOKEN: source.CLOUDFLARE_API_TOKEN || undefined,
};
