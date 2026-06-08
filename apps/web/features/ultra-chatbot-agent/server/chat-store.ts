import {
  cleanupExpiredUltraChatbotAgentChats as cleanupExpiredUltraChatbotAgentChatsForStore,
  getUltraChatbotAgentChatNotFoundError as getUltraChatbotAgentChatNotFoundErrorFromInternals,
  type UltraChatbotAgentChatCleanupPersistence as InternalUltraChatbotAgentChatCleanupPersistence,
  type UltraChatbotAgentChatCleanupResult as InternalUltraChatbotAgentChatCleanupResult,
  type UltraChatbotAgentChatRecord as InternalUltraChatbotAgentChatRecord,
  type UltraChatbotAgentChatSession as InternalUltraChatbotAgentChatSession,
  type UltraChatbotAgentExpiredChatRecord as InternalUltraChatbotAgentExpiredChatRecord,
  type UltraChatbotAgentHistoryPage as InternalUltraChatbotAgentHistoryPage,
  type UltraChatbotAgentVoteRecord as InternalUltraChatbotAgentVoteRecord,
  ultraChatbotAgentCleanupRetentionDays as ultraChatbotAgentCleanupRetentionDaysFromInternals,
} from "./chat-store-internals";
import {
  deleteAllUltraChatbotAgentChatsForVisitor,
  deleteUltraChatbotAgentChatForVisitor,
  deleteUltraChatbotAgentMessagesAfterMessage,
  deleteUltraChatbotAgentVote,
  saveUltraChatbotAgentFinishedMessages,
  saveUltraChatbotAgentIncomingUserMessage,
  saveUltraChatbotAgentVote,
  setUltraChatbotAgentActiveStream,
  setUltraChatbotAgentChatCapabilities,
  setUltraChatbotAgentChatVisibility,
} from "./chat-store-mutation-actions";
import {
  listUltraChatbotAgentChatsForVisitor,
  listUltraChatbotAgentChatsForVisitorPage,
  listUltraChatbotAgentVotesForChat,
  loadUltraChatbotAgentChatSession,
} from "./chat-store-query-actions";

export type UltraChatbotAgentChatCleanupPersistence =
  InternalUltraChatbotAgentChatCleanupPersistence;
export type UltraChatbotAgentChatCleanupResult =
  InternalUltraChatbotAgentChatCleanupResult;
export type UltraChatbotAgentChatRecord = InternalUltraChatbotAgentChatRecord;
export type UltraChatbotAgentChatSession = InternalUltraChatbotAgentChatSession;
export type UltraChatbotAgentExpiredChatRecord =
  InternalUltraChatbotAgentExpiredChatRecord;
export type UltraChatbotAgentHistoryPage = InternalUltraChatbotAgentHistoryPage;
export type UltraChatbotAgentVoteRecord = InternalUltraChatbotAgentVoteRecord;

export const cleanupExpiredUltraChatbotAgentChats =
  cleanupExpiredUltraChatbotAgentChatsForStore;
export const ultraChatbotAgentCleanupRetentionDays =
  ultraChatbotAgentCleanupRetentionDaysFromInternals;

export function getUltraChatbotAgentChatNotFoundError(chatId: string) {
  return getUltraChatbotAgentChatNotFoundErrorFromInternals(chatId);
}

export function createUltraChatbotAgentChatStore() {
  return {
    cleanupExpiredChats: cleanupExpiredUltraChatbotAgentChatsForStore,
    deleteAllChatsForVisitor: deleteAllUltraChatbotAgentChatsForVisitor,
    deleteChatForVisitor: deleteUltraChatbotAgentChatForVisitor,
    deleteMessagesAfterMessage: deleteUltraChatbotAgentMessagesAfterMessage,
    deleteVote: deleteUltraChatbotAgentVote,
    listChatsForVisitor: listUltraChatbotAgentChatsForVisitor,
    listChatsForVisitorPage: listUltraChatbotAgentChatsForVisitorPage,
    listVotesForChat: listUltraChatbotAgentVotesForChat,
    loadChatSession: loadUltraChatbotAgentChatSession,
    saveFinishedMessages: saveUltraChatbotAgentFinishedMessages,
    saveIncomingUserMessage: saveUltraChatbotAgentIncomingUserMessage,
    saveVote: saveUltraChatbotAgentVote,
    setActiveStream: setUltraChatbotAgentActiveStream,
    setChatCapabilities: setUltraChatbotAgentChatCapabilities,
    setChatVisibility: setUltraChatbotAgentChatVisibility,
  };
}
