"use client";

import { useMemo, useState } from "react";

import type {
  UltraChatbotAgentChatSession,
  UltraChatbotAgentHistoryPage,
} from "../server/chat-store";
import type { UltraChatbotAgentModel } from "../server/models";
import { shouldShowUltraChatbotAgentResumeThinking } from "./resume-pending-state";
import { UltraChatbotAgentChatPanel } from "./ultra-chatbot-agent-chat-panel";
import { UltraChatbotAgentHistorySidebar } from "./ultra-chatbot-agent-history-sidebar";
import { hasUltraChatbotAgentVisibleMessageContent } from "./ultra-chatbot-agent-message-parts";
import { UltraChatbotAgentSessionSidebar } from "./ultra-chatbot-agent-session-sidebar";
import { findUltraChatbotAgentModel } from "./ultra-chatbot-agent-workspace-api";
import { useUltraChatbotAgentArtifact } from "./use-ultra-chatbot-agent-artifact";
import { useUltraChatbotAgentArtifactRefresh } from "./use-ultra-chatbot-agent-artifact-refresh";
import { useUltraChatbotAgentChatRuntime } from "./use-ultra-chatbot-agent-chat-runtime";
import { useUltraChatbotAgentMessageEditing } from "./use-ultra-chatbot-agent-message-editing";
import { useUltraChatbotAgentResumeRecovery } from "./use-ultra-chatbot-agent-resume-recovery";
import { useUltraChatbotAgentSandbox } from "./use-ultra-chatbot-agent-sandbox";
import { useUltraChatbotAgentVotes } from "./use-ultra-chatbot-agent-votes";

interface UltraChatbotAgentWorkspaceProps {
  defaultChatModel: string;
  draftChatId: string;
  initialHistoryPage: UltraChatbotAgentHistoryPage;
  initialSession: UltraChatbotAgentChatSession | null;
  isChatAvailable: boolean;
  models: UltraChatbotAgentModel[];
  nodeVersion: string;
  setupMessage: string | null;
}

export function UltraChatbotAgentWorkspace({
  defaultChatModel,
  draftChatId,
  initialHistoryPage,
  initialSession,
  isChatAvailable,
  models,
  nodeVersion,
  setupMessage,
}: UltraChatbotAgentWorkspaceProps) {
  const runtime = useUltraChatbotAgentChatRuntime({
    defaultChatModel,
    draftChatId,
    initialSession,
  });
  const [composerError, setComposerError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const artifact = useUltraChatbotAgentArtifact();
  const editing = useUltraChatbotAgentMessageEditing({
    chatId: runtime.chatMeta.id,
    regenerate: runtime.regenerate,
    setMessages: runtime.setMessages,
  });
  const sandbox = useUltraChatbotAgentSandbox({
    addToolApprovalResponse: runtime.addToolApprovalResponse,
    chatId: runtime.chatMeta.id,
    setChatMeta: runtime.setChatMeta,
  });
  const votes = useUltraChatbotAgentVotes({
    chatId: runtime.chatMeta.id,
    messagesLength: runtime.messages.length,
  });
  const latestAssistant = useMemo(
    () =>
      [...runtime.messages]
        .reverse()
        .find((message) => message.role === "assistant"),
    [runtime.messages]
  );
  const showThinking =
    runtime.isBusy &&
    !(
      latestAssistant &&
      hasUltraChatbotAgentVisibleMessageContent(latestAssistant)
    );
  const showResumeThinking = shouldShowUltraChatbotAgentResumeThinking({
    initialSession,
    messages: runtime.messages,
  });
  const submitStatus =
    showResumeThinking && runtime.status === "streaming"
      ? "submitted"
      : runtime.status;
  const selectedModel =
    findUltraChatbotAgentModel(models, runtime.chatMeta.selectedChatModel) ??
    models.at(0);
  const chatPanelProps = {
    chatMeta: runtime.chatMeta,
    composerError,
    editError: editing.editError,
    editingMessageId: editing.editingMessageId,
    editingRetainedFileUrls: editing.editingRetainedFileUrls,
    editingText: editing.editingText,
    error: runtime.error,
    hasMessages: runtime.hasMessages,
    initialSession,
    isBusy: runtime.isBusy,
    isChatAvailable,
    isModelSelectorOpen,
    isSandboxUpdating: sandbox.isSandboxUpdating,
    messages: runtime.messages,
    models,
    onArtifactOpen: artifact.openArtifact,
    onCancelEdit: editing.handleCancelEdit,
    onComposerErrorChange: setComposerError,
    onEditTextChange: editing.setEditingText,
    onModelChange: runtime.handleModelChange,
    onModelSelectorOpenChange: setIsModelSelectorOpen,
    onRemoveEditingFile: editing.handleRemoveEditingFile,
    onSandboxApprovalResponse: sandbox.handleSandboxApprovalResponse,
    onSaveEdit: editing.handleSaveEdit,
    onStartEdit: editing.handleStartEdit,
    onSubmit: runtime.handleSubmit,
    onVisibilityChange: runtime.handleVisibilityChange,
    onVisibilityError: setVisibilityError,
    onVote: votes.handleVote,
    pendingVote: votes.pendingVote,
    retryConversationError: runtime.retryConversationError,
    selectedModel,
    setupMessage,
    showResumeThinking,
    showThinking,
    status: runtime.status,
    stop: runtime.stop,
    submitStatus,
    visibilityError,
    votesByMessageId: votes.votesByMessageId,
  };
  const sessionSidebarProps = {
    artifactMode: artifact.mode,
    artifactRefreshToken: artifact.refreshToken,
    chatMeta: runtime.chatMeta,
    disabled: !isChatAvailable || runtime.isBusy,
    hasMessages: runtime.hasMessages,
    initialSession,
    isSandboxUpdating: sandbox.isSandboxUpdating,
    nodeVersion,
    onArtifactClose: artifact.closeArtifact,
    onArtifactModeChange: artifact.setMode,
    onArtifactOpen: artifact.openArtifact,
    onArtifactRefresh: artifact.refreshArtifact,
    onResumeStream: runtime.resumeStream,
    onSandboxCapabilityChange: sandbox.handleSandboxCapabilityChange,
    sandboxError: sandbox.sandboxError,
    selectedDocumentId: artifact.selectedDocumentId,
    selectedModel,
  };

  useUltraChatbotAgentResumeRecovery({
    chatId: runtime.chatId,
    initialSession,
    latestMessageRole: runtime.latestMessageRole,
    messagesLength: runtime.messages.length,
    setChatMeta: runtime.setChatMeta,
    setMessages: runtime.setMessages,
    status: runtime.status,
  });
  useUltraChatbotAgentArtifactRefresh({
    messages: runtime.messages,
    refreshArtifact: artifact.refreshArtifact,
  });

  return (
    <div className="grid min-h-[70svh] min-w-0 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
      <UltraChatbotAgentHistorySidebar
        currentChatId={runtime.chatMeta.id}
        currentChatRecordHint={runtime.currentChatRecordHint}
        initialHistoryPage={initialHistoryPage}
      />
      <UltraChatbotAgentChatPanel {...chatPanelProps} />
      <UltraChatbotAgentSessionSidebar {...sessionSidebarProps} />
    </div>
  );
}
