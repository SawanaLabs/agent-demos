import "server-only";

import { env } from "@/env";
import { deploymentContextFromEnvironment } from "./deployment-context";
import { runtimeErrorEventCatalog } from "./events";
import { createRuntimeErrorLogger } from "./logger";

export const runtimeErrorLogger = createRuntimeErrorLogger({
  createId: () => crypto.randomUUID(),
  deployment: () =>
    deploymentContextFromEnvironment({
      NODE_ENV: env.NODE_ENV,
      VERCEL: env.VERCEL,
      VERCEL_ENV: env.VERCEL_ENV,
      VERCEL_GIT_COMMIT_REF: env.VERCEL_GIT_COMMIT_REF,
      VERCEL_TARGET_ENV: env.VERCEL_TARGET_ENV,
      VERCEL_URL: env.VERCEL_URL,
    }),
  events: runtimeErrorEventCatalog,
  now: () => new Date(),
  service: "agent_demos_web",
  sink: (record) => console.error(record),
});
