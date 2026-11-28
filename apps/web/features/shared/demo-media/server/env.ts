import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export function demoMediaEnv() {
  return createEnv({
    runtimeEnv: {
      PRIVATE_MEDIA_BACKEND: process.env.PRIVATE_MEDIA_BACKEND,
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
      R2_PRIVATE_MEDIA_ACCESS_KEY_ID:
        process.env.R2_PRIVATE_MEDIA_ACCESS_KEY_ID,
      R2_PRIVATE_MEDIA_SECRET_ACCESS_KEY:
        process.env.R2_PRIVATE_MEDIA_SECRET_ACCESS_KEY,
    },
    server: {
      PRIVATE_MEDIA_BACKEND: z
        .enum(["blob", "r2-migrating", "r2"])
        .default("blob"),
      R2_ACCOUNT_ID: z
        .string()
        .regex(/^[a-f0-9]{32}$/)
        .optional(),
      R2_PRIVATE_MEDIA_ACCESS_KEY_ID: z.string().min(1).optional(),
      R2_PRIVATE_MEDIA_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    },
    emptyStringAsUndefined: true,
  });
}
