import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      REDIS_URL: z.string().url().optional(),
    },
    runtimeEnv: {
      REDIS_URL: process.env.REDIS_URL,
    },
  });
