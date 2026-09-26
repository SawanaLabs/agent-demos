"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

import type { EveAgentUIMessage } from "../types";

export function useEveAgent() {
  return useDemoChat<EveAgentUIMessage>({
    api: "/api/demos/eve-agent",
  });
}
