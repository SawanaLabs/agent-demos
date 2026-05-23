"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useState } from "react";

import { getLatestPreviewOutput } from "./preview-state";
import { samplePrompts } from "./sandbox-agent-model";
import { useSandboxPreviewState } from "./use-sandbox-preview-state";

export type SandboxAgentTab = "conversation" | "preview";

export function useSandboxAgentWorkspaceViewModel() {
  const [activeTab, setActiveTab] = useState<SandboxAgentTab>("conversation");
  const [isTabsMounted, setIsTabsMounted] = useState(false);
  const [chat] = useState(
    () =>
      new Chat({
        transport: new DefaultChatTransport({
          api: "/api/demos/sandbox-agent",
        }),
      })
  );
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    chat,
  });
  const latestPreview = useMemo(
    () => getLatestPreviewOutput(messages),
    [messages]
  );
  const previewState = useSandboxPreviewState(latestPreview);
  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";

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
