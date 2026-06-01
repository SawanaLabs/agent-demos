import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { DEFAULT_GATEWAY_BASE_URL } from "./contract";

export const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";

export const keys = () =>
  createEnv({
    server: {
      AI_GATEWAY_API_KEY: z.string().min(1).optional(),
      AI_GATEWAY_BASE_URL: z.string().url().default(DEFAULT_GATEWAY_BASE_URL),
      AI_GATEWAY_CHAT_MODEL: z.string().min(1).default(DEFAULT_CHAT_MODEL),
    },
    runtimeEnv: {
      AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
      AI_GATEWAY_BASE_URL: process.env.AI_GATEWAY_BASE_URL,
      AI_GATEWAY_CHAT_MODEL: process.env.AI_GATEWAY_CHAT_MODEL,
    },
  });
