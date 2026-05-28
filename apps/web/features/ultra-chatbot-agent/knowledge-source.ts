import { ragChatbotSourceDocument } from "@/features/rag-chatbot/server/source-document";

export const ultraChatbotAgentKnowledgeSource = {
  description: ragChatbotSourceDocument.description,
  documentUrl: ragChatbotSourceDocument.documentUrl,
  slug: ragChatbotSourceDocument.slug,
  sourcePageUrl: ragChatbotSourceDocument.sourcePageUrl,
  title: ragChatbotSourceDocument.title,
} as const;
