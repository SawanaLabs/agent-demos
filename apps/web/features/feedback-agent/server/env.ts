import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export function feedbackEnv() {
  return createEnv({
    server: {
      REDIS_URL: z.string().url().optional(),
      AI_GATEWAY_API_KEY: z.string().min(1).optional(),
      AI_GATEWAY_BASE_URL: z
        .string()
        .url()
        .default("https://ai-gateway.vercel.sh/v3/ai"),
      AI_GATEWAY_CHAT_MODEL: z.string().default("openai/gpt-5.6-luna"),
    },
    runtimeEnv: {
      REDIS_URL: process.env.REDIS_URL,
      AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
      AI_GATEWAY_BASE_URL: process.env.AI_GATEWAY_BASE_URL,
      AI_GATEWAY_CHAT_MODEL: process.env.AI_GATEWAY_CHAT_MODEL,
    },
  });
}
