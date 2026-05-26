import { env as appEnv } from "@/env";

import type { RagChatbotEnv } from "./env";

export function getRagChatbotAppEnv(): RagChatbotEnv {
  return appEnv;
}
