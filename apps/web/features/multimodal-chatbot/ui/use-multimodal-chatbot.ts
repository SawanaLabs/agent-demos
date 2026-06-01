"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useMultimodalChatbot() {
  return useDemoChat({ api: "/api/demos/multimodal-chatbot" });
}
