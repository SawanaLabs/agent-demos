import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { keys as aiGateway } from "@/features/shared/ai-gateway/server/keys";
import { keys as cron } from "@/features/shared/cron/server/keys";
import { keys as database } from "@/features/shared/database/server/keys";
import { keys as redis } from "@/features/shared/redis/server/keys";
import { keys as vercelSandbox } from "@/features/shared/vercel-sandbox/server/keys";

function createAppEnv() {
  return createEnv({
    extends: [aiGateway(), cron(), database(), redis(), vercelSandbox()],
    server: {
      NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    },
    client: {},
    runtimeEnv: {
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}

export type AppEnv = ReturnType<typeof createAppEnv>;

export function getEnv(): AppEnv {
  return createAppEnv();
}

export const env: AppEnv = new Proxy({} as AppEnv, {
  get(_target, property) {
    return getEnv()[property as keyof AppEnv];
  },
});
