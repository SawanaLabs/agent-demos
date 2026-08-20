import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      NODE_ENV: z.enum(["development", "production", "test"]).optional(),
      VERCEL: z.literal("1").optional(),
      VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
      VERCEL_GIT_COMMIT_REF: z.string().trim().min(1).optional(),
      VERCEL_TARGET_ENV: z.string().trim().min(1).optional(),
      VERCEL_URL: z.string().trim().min(1).optional(),
    },
    runtimeEnv: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
      VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    },
  });
