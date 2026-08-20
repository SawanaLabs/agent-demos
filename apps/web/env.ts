import { createEnv } from "@t3-oss/env-nextjs";
import { keys as langGraphAgent } from "@/features/langgraph-agent/server/keys";
import { keys as aiGateway } from "@/features/shared/ai-gateway/server/keys";
import { keys as cron } from "@/features/shared/cron/server/keys";
import { keys as database } from "@/features/shared/database/server/keys";
import { keys as redis } from "@/features/shared/redis/server/keys";
import { keys as vercelBlob } from "@/features/shared/vercel-blob/server/keys";
import { keys as vercelEnvironment } from "@/features/shared/vercel-environment/server/keys";
import { keys as vercelSandbox } from "@/features/shared/vercel-sandbox/server/keys";
import { keys as siteAnalytics } from "@/features/site-analytics/server/keys";

function createAppEnv() {
  return createEnv({
    extends: [
      aiGateway(),
      cron(),
      database(),
      langGraphAgent(),
      redis(),
      siteAnalytics(),
      vercelBlob(),
      vercelEnvironment(),
      vercelSandbox(),
    ],
    client: {},
    runtimeEnv: {},
    server: {},
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
