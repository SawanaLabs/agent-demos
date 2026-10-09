"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

import type { MultiAgentExplorerUIMessage } from "../types";

export function useMultiAgentExplorer() {
  return useDemoChat<MultiAgentExplorerUIMessage>({
    api: "/api/demos/multi-agent-explorer",
  });
}
