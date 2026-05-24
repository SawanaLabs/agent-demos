import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      VERCEL_OIDC_TOKEN: z.string().min(1).optional(),
      VERCEL_PROJECT_ID: z.string().min(1).optional(),
      VERCEL_TEAM_ID: z.string().min(1).optional(),
      VERCEL_TOKEN: z.string().min(1).optional(),
    },
    runtimeEnv: {
      VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
      VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
      VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
      VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    },
  });
