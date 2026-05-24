"use client";

import { useEffect, useMemo, useState } from "react";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";
import { getLatestPreviewOutput } from "./preview-state";
import { samplePrompts } from "./sandbox-agent-model";
import { useSandboxPreviewState } from "./use-sandbox-preview-state";

export type SandboxAgentTab = "conversation" | "preview";

export function useSandboxAgentWorkspaceViewModel() {
  const [activeTab, setActiveTab] = useState<SandboxAgentTab>("conversation");
  const [isTabsMounted, setIsTabsMounted] = useState(false);
  const {
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useDemoChat({
    api: "/api/demos/sandbox-agent",
  });
  const latestPreview = useMemo(
    () => getLatestPreviewOutput(messages),
    [messages]
  );
  const previewState = useSandboxPreviewState(latestPreview);

  useEffect(() => {
    setIsTabsMounted(true);
  }, []);

  return {
    activeTab,
    error,
    hasMessages,
    isBusy,
    latestPreview,
    messages,
    previewState,
    samplePrompts,
    setActiveTab,
    status,
    stop,
    isTabsMounted,
    actions: {
      onOpenPreview: () => setActiveTab("preview"),
      onRegenerate: () => regenerate(),
      onSendMessage: (text: string) => sendMessage({ text }),
      onStop: stop,
      onTabChange: (value: SandboxAgentTab) => setActiveTab(value),
    },
  };
}
