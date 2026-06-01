"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useSandboxAgentChat() {
  return useDemoChat({ api: "/api/demos/sandbox-agent" });
}
