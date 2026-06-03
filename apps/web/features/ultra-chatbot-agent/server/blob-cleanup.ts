import { env as appEnv } from "@/env";
import { getVercelBlobToken } from "@/features/shared/vercel-blob/server/env";

import {
  cleanupExpiredUltraChatbotAgentBlobs,
  type UltraChatbotAgentBlobStorageEnv,
} from "./blob-storage";

export const ultraChatbotAgentBlobCleanupRetentionDays = 7;
export const ultraChatbotAgentBlobCleanupCronScheduleUtc = "0 20 * * *";

export function cleanupExpiredUltraChatbotAgentUploadBlobs(
  env: UltraChatbotAgentBlobStorageEnv = appEnv
) {
  return cleanupExpiredUltraChatbotAgentBlobs({
    retentionDays: ultraChatbotAgentBlobCleanupRetentionDays,
    token: getVercelBlobToken(env),
  });
}
