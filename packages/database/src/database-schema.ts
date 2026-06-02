import {
  customerMemoryCompactions,
  customerMemoryEmbeddings,
  customerMemoryEvents,
  customerMemoryMemories,
  customerMemoryMessages,
  customerMemoryThreads,
} from "./schemas/customer-memory-agent";
import {
  persistentAgentChats,
  persistentAgentMessages,
} from "./schemas/persistent-agent";
import {
  ragChatbotEmbeddings,
  ragChatbotResources,
} from "./schemas/rag-chatbot";
import {
  siteUsageAccessCodes,
  siteUsageEvents,
  siteUsageVisitors,
  siteUsageWaitlistEntries,
} from "./schemas/site-usage";
import {
  ultraChatbotAgentChats,
  ultraChatbotAgentDocuments,
  ultraChatbotAgentMessages,
  ultraChatbotAgentStreams,
  ultraChatbotAgentSuggestions,
  ultraChatbotAgentVotes,
} from "./schemas/ultra-chatbot-agent";

export const databaseSchema = {
  customerMemoryCompactions,
  customerMemoryEmbeddings,
  customerMemoryEvents,
  customerMemoryMemories,
  customerMemoryMessages,
  customerMemoryThreads,
  persistentAgentChats,
  persistentAgentMessages,
  ragChatbotEmbeddings,
  ragChatbotResources,
  siteUsageAccessCodes,
  siteUsageEvents,
  siteUsageVisitors,
  siteUsageWaitlistEntries,
  ultraChatbotAgentChats,
  ultraChatbotAgentDocuments,
  ultraChatbotAgentMessages,
  ultraChatbotAgentStreams,
  ultraChatbotAgentSuggestions,
  ultraChatbotAgentVotes,
} as const;
