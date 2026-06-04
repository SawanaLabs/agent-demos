import { ragChatbotSourceDocument } from "@/lib/ultra-chatbot-agent/rag-chatbot/source-document";

export const ultraChatbotAgentKnowledgeSource = {
  description: ragChatbotSourceDocument.description,
  documentUrl: ragChatbotSourceDocument.documentUrl,
  slug: ragChatbotSourceDocument.slug,
  sourcePageUrl: ragChatbotSourceDocument.sourcePageUrl,
  title: ragChatbotSourceDocument.title,
} as const;
