"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useGenerativeUiChat() {
  return useDemoChat({ api: "/api/demos/generative-ui" });
}
