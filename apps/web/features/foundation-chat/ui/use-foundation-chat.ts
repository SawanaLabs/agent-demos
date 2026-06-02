"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useFoundationChat() {
  return useDemoChat({ api: "/api/demos/foundation-chat" });
}
