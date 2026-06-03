"use client";

import { useEffect, useMemo, useState } from "react";

import { useConversationErrorRetry } from "@/features/shared/chat/ui/conversation-error-message";

import { getLatestPreviewOutput } from "./preview-state";
import { samplePrompts } from "./sandbox-agent-model";
import { useSandboxAgentChat } from "./use-sandbox-agent-chat";
import { useSandboxPreviewState } from "./use-sandbox-preview-state";

export type SandboxAgentTab = "conversation" | "preview";

export function useSandboxAgentWorkspaceViewModel() {
  const [activeTab, setActiveTab] = useState<SandboxAgentTab>("conversation");
  const [isTabsMounted, setIsTabsMounted] = useState(false);
  const {
    clearError,
    error,
    hasMessages,
    isBusy,
    chat,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useSandboxAgentChat();
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const latestPreview = useMemo(
    () => getLatestPreviewOutput(messages),
    [messages]
  );
  const previewState = useSandboxPreviewState(latestPreview, chat.id);

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
      onRetryError: retryConversationError,
      onSendMessage: (text: string) => sendMessage({ text }),
      onStop: stop,
      onTabChange: (value: SandboxAgentTab) => setActiveTab(value),
    },
  };
}
