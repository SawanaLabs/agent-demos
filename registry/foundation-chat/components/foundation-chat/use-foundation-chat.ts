"use client";

import { useDemoChat } from "@/components/demo-chat/use-demo-chat";

export function useFoundationChat() {
  return useDemoChat({ api: "/api/demos/foundation-chat" });
}
