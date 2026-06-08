"use client";

import { Chat } from "@ai-sdk/react";
import { cn } from "@workspace/ui/lib/utils";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useEffect, useState } from "react";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";
import type { OpenAiAgentsSdkDemoMessage } from "../message-metadata";
import { OpenAiAgentsSdkDemoChatPanel } from "./openai-agents-sdk-demo-chat-panel";
import { OpenAiAgentsSdkDemoInspectorSidebar } from "./openai-agents-sdk-demo-inspector-sidebar";
import { buildOpenAiAgentsSdkDemoRuntimeInspector } from "./openai-agents-sdk-demo-runtime-inspector";
import {
  getOpenAiAgentsSdkDemoFailedTurnRetryText,
  getOpenAiAgentsSdkDemoRecoverableMessages,
} from "./openai-agents-sdk-demo-session";
import { openAiAgentsSdkDemoWorkspaceLayout } from "./openai-agents-sdk-demo-workspace-layout";
import type {
  OpenAiAgentsSdkDemoChatError,
  OpenAiAgentsSdkDemoWorkspaceProps,
} from "./openai-agents-sdk-demo-workspace-types";

export type { OpenAiAgentsSdkDemoWorkspaceProps } from "./openai-agents-sdk-demo-workspace-types";

export function OpenAiAgentsSdkDemoWorkspace({
  aiSdkExtensionProfile,
  chatModel,
  contextProfile,
  guardrailCatalog,
  guideCoverage,
  handoffCatalog,
  isChatAvailable,
  mcpCatalog,
  mcpProfile,
  modelProfile,
  nodeVersion,
  runProfile,
  sandboxProfile,
  sessionProfile,
  setupMessage,
  traceProfile,
  toolCatalog,
  voiceProfile,
}: OpenAiAgentsSdkDemoWorkspaceProps) {
  const {
    addToolApprovalResponse,
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useDemoChat<OpenAiAgentsSdkDemoMessage>({
    createChat: () =>
      new Chat({
        sendAutomaticallyWhen:
          lastAssistantMessageIsCompleteWithApprovalResponses,
        transport: new DefaultChatTransport({
          api: "/api/demos/openai-agents-sdk-demo",
        }),
      }),
  });
  const [hasUsedVoiceGuide, setHasUsedVoiceGuide] = useState(false);
  const [chatErrorMessage, setChatErrorMessage] =
    useState<OpenAiAgentsSdkDemoChatError | null>(null);

  useEffect(() => {
    if (!error) {
      return;
    }

    setChatErrorMessage({
      id: `openai-agents-sdk-demo-error-${Date.now()}`,
      message: error.message,
      retryText: getOpenAiAgentsSdkDemoFailedTurnRetryText(messages),
    });
    setMessages(getOpenAiAgentsSdkDemoRecoverableMessages(messages));
    clearError();
  }, [clearError, error, messages, setMessages]);

  function handleSendMessage(text: string) {
    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return;
    }

    clearError();
    setChatErrorMessage(null);
    sendMessage({ text: trimmedText });
  }

  const runtimeInspector = buildOpenAiAgentsSdkDemoRuntimeInspector({
    aiSdkExtensionProfile,
    guideCoverage,
    hasUsedVoiceGuide,
    messages,
    traceProfile,
  });

  return (
    <div
      className={cn(
        "grid grid-rows-[minmax(0,1fr)_minmax(0,26rem)] gap-4 overflow-hidden md:grid-cols-[minmax(0,1fr)_20rem] md:grid-rows-1",
        openAiAgentsSdkDemoWorkspaceLayout.workspaceHeightClassName
      )}
    >
      <OpenAiAgentsSdkDemoChatPanel
        addToolApprovalResponse={addToolApprovalResponse}
        chatErrorMessage={chatErrorMessage}
        chatModel={chatModel}
        hasMessages={hasMessages}
        hasPendingApproval={runtimeInspector.hasPendingApproval}
        isBusy={isBusy}
        isChatAvailable={isChatAvailable}
        messages={messages}
        onRegenerate={regenerate}
        onRetryFailedTurn={handleSendMessage}
        onSendMessage={handleSendMessage}
        onStop={stop}
        setupMessage={setupMessage}
        status={status}
      />
      <OpenAiAgentsSdkDemoInspectorSidebar
        aiSdkExtensionProfile={aiSdkExtensionProfile}
        contextProfile={contextProfile}
        guardrailCatalog={guardrailCatalog}
        handoffCatalog={handoffCatalog}
        mcpCatalog={mcpCatalog}
        mcpProfile={mcpProfile}
        modelProfile={modelProfile}
        nodeVersion={nodeVersion}
        onVoiceGuideUsageChange={setHasUsedVoiceGuide}
        runProfile={runProfile}
        runtimeInspector={runtimeInspector}
        sandboxProfile={sandboxProfile}
        sessionProfile={sessionProfile}
        toolCatalog={toolCatalog}
        traceProfile={traceProfile}
        voiceProfile={voiceProfile}
      />
    </div>
  );
}
