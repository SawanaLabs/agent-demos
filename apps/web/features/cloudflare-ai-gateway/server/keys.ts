import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { authModes, imageGateways } from "../contract";

export const keys = () =>
  createEnv({
    emptyStringAsUndefined: true,
    server: {
      IMAGE_GATEWAY: z.enum(imageGateways).default("cloudflare"),
      CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
      CLOUDFLARE_AI_GATEWAY_ID: z.string().min(1).optional(),
      CLOUDFLARE_AI_GATEWAY_TOKEN: z.string().min(1).optional(),
      CLOUDFLARE_AI_GATEWAY_AUTH_MODE: z.enum(authModes).default("byok"),
      CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS: z.string().min(1).optional(),
      CLOUDFLARE_OPENAI_API_KEY: z.string().min(1).optional(),
      CLOUDFLARE_GOOGLE_API_KEY: z.string().min(1).optional(),
      CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
    },
    runtimeEnv: {
      IMAGE_GATEWAY: process.env.IMAGE_GATEWAY,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_AI_GATEWAY_ID: process.env.CLOUDFLARE_AI_GATEWAY_ID,
      CLOUDFLARE_AI_GATEWAY_TOKEN: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN,
      CLOUDFLARE_AI_GATEWAY_AUTH_MODE:
        process.env.IMAGE_GATEWAY === "vercel"
          ? undefined
          : process.env.CLOUDFLARE_AI_GATEWAY_AUTH_MODE,
      CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS:
        process.env.CLOUDFLARE_AI_GATEWAY_BYOK_ALIAS,
      CLOUDFLARE_OPENAI_API_KEY: process.env.CLOUDFLARE_OPENAI_API_KEY,
      CLOUDFLARE_GOOGLE_API_KEY: process.env.CLOUDFLARE_GOOGLE_API_KEY,
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    },
  });
