"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useMcpAgentChat() {
  return useDemoChat({ api: "/api/demos/mcp-agent" });
}
