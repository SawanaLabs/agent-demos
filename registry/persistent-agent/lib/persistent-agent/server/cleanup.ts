import {
  persistentAgentCleanupCronScheduleUtc as cleanupCronScheduleUtc,
  createPersistentAgentChatStore,
} from "./chat-store";

export const persistentAgentCleanupCronScheduleUtc = cleanupCronScheduleUtc;

export function cleanupExpiredPersistentAgentChats() {
  return createPersistentAgentChatStore().cleanupExpiredChats();
}
