"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useRagChatbot() {
  return useDemoChat({ api: "/api/demos/rag-chatbot" });
}
