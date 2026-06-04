import { getUltraChatbotAgentAppEnv } from "./env";

const appEnv = getUltraChatbotAgentAppEnv();
import { demoDataRetentionDays } from "./demo-data-retention-policy";

import { cleanupExpiredUltraChatbotAgentUploadBlobs } from "./blob-cleanup";
import type { UltraChatbotAgentBlobStorageEnv } from "./blob-storage";
import { cleanupExpiredUltraChatbotAgentChats } from "./chat-store";

export const ultraChatbotAgentCleanupRetentionDays = demoDataRetentionDays;
export const ultraChatbotAgentCleanupCronScheduleUtc = "0 20 * * *";

export async function cleanupExpiredUltraChatbotAgentDemoData(
  input: {
    env?: UltraChatbotAgentBlobStorageEnv;
    now?: Date;
    retentionDays?: number;
  } = {}
) {
  const retentionDays =
    input.retentionDays ?? ultraChatbotAgentCleanupRetentionDays;
  const [database, blobs] = await Promise.all([
    cleanupExpiredUltraChatbotAgentChats({
      now: input.now,
      retentionDays,
    }),
    cleanupExpiredUltraChatbotAgentUploadBlobs(input.env ?? appEnv, {
      now: input.now,
      retentionDays,
    }),
  ]);

  return {
    blobs,
    database,
    retentionDays,
  };
}
