import { env } from "@/env";
import type { ProjectGuideCompanionEnv } from "./env";

export function getProjectGuideCompanionAppEnv(): ProjectGuideCompanionEnv {
  return {
    AI_GATEWAY_API_KEY: env.AI_GATEWAY_API_KEY,
    AI_GATEWAY_BASE_URL: env.AI_GATEWAY_BASE_URL,
    AI_GATEWAY_CHAT_MODEL: env.AI_GATEWAY_CHAT_MODEL,
  };
}
