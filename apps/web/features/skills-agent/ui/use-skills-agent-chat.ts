"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useSkillsAgentChat() {
  return useDemoChat({ api: "/api/demos/skills-agent" });
}
