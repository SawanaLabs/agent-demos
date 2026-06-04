import { getUltraChatbotAgentAppEnv } from "./env";

const appEnv = getUltraChatbotAgentAppEnv();
import { demoDataRetentionDays } from "./demo-data-retention-policy";
import { getVercelBlobToken } from "./env";

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
