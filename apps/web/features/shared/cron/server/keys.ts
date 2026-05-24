import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      CRON_SECRET: z.string().min(1).optional(),
    },
    runtimeEnv: {
      CRON_SECRET: process.env.CRON_SECRET,
    },
  });
