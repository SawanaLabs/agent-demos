import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      SITE_USAGE_VISITOR_SECRET: z.string().min(32).optional(),
    },
    runtimeEnv: {
      SITE_USAGE_VISITOR_SECRET: process.env.SITE_USAGE_VISITOR_SECRET,
    },
  });
