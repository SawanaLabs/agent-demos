import { env as appEnv } from "@/env";
import { demoDataRetentionDays } from "@/features/shared/demo-data-retention/server/policy";
import { getVercelBlobToken } from "@/features/shared/vercel-blob/server/env";

import {
  cleanupExpiredUltraChatbotAgentBlobs,
  type UltraChatbotAgentBlobStorageEnv,
} from "./blob-storage";

export const ultraChatbotAgentBlobCleanupRetentionDays = demoDataRetentionDays;
export const ultraChatbotAgentBlobCleanupCronScheduleUtc = "0 20 * * *";

export function cleanupExpiredUltraChatbotAgentUploadBlobs(
  env: UltraChatbotAgentBlobStorageEnv = appEnv,
  input: {
    now?: Date;
    retentionDays?: number;
  } = {}
) {
  return cleanupExpiredUltraChatbotAgentBlobs({
    now: input.now,
    retentionDays:
      input.retentionDays ?? ultraChatbotAgentBlobCleanupRetentionDays,
    token: getVercelBlobToken(env),
  });
}
