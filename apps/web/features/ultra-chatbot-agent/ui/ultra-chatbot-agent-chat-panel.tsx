"use client";

import { CaretDownIcon, RobotIcon } from "@phosphor-icons/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@workspace/ui/components/ai-elements/model-selector";
import { Badge } from "@workspace/ui/components/badge";
import type { ChatStatus, UIMessage } from "ai";
import type { Dispatch, SetStateAction } from "react";

import { ConversationErrorMessage } from "@/features/shared/chat/ui/conversation-error-message";

import type { UltraChatbotAgentChatSession } from "../server/chat-store";
import type { UltraChatbotAgentModel } from "../server/models";
import { UltraChatbotAgentMessages } from "./ultra-chatbot-agent-messages";
import { UltraChatbotAgentMultimodalInput } from "./ultra-chatbot-agent-multimodal-input";
import { UltraChatbotAgentSuggestedActions } from "./ultra-chatbot-agent-suggested-actions";
import { UltraChatbotAgentVisibilitySelector } from "./ultra-chatbot-agent-visibility-selector";
import type { UltraChatbotAgentWorkspaceChatMeta } from "./ultra-chatbot-agent-workspace-model";

interface UltraChatbotAgentChatPanelProps {
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
  composerError: string | null;
  editError: string | null;
  editingMessageId: string | null;
  editingRetainedFileUrls: string[];
  editingText: string;
  error: Error | undefined;
  hasMessages: boolean;
  initialSession: UltraChatbotAgentChatSession | null;
  isBusy: boolean;
  isChatAvailable: boolean;
  isModelSelectorOpen: boolean;
  isSandboxUpdating: boolean;
  messages: UIMessage[];
  models: UltraChatbotAgentModel[];
  onArtifactOpen: (documentId: string) => void;
  onCancelEdit: () => void;
  onComposerErrorChange: (message: string | null) => void;
  onEditTextChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  onModelSelectorOpenChange: Dispatch<SetStateAction<boolean>>;
  onRemoveEditingFile: (url: string) => void;
  onSandboxApprovalResponse: (input: {
    approvalId: string;
    approved: boolean;
    reason: string;
  }) => void | Promise<void>;
  onSaveEdit: (message: UIMessage) => void | Promise<void>;
  onStartEdit: (input: {
    messageId: string;
    retainedFileUrls: string[];
    text: string;
  }) => void;
  onSubmit: (parts: UIMessage["parts"]) => Promise<void>;
  onVisibilityChange: (visibility: "private" | "public") => void;
  onVisibilityError: (message: string | null) => void;
  onVote: (messageId: string, type: "down" | "up") => void | Promise<void>;
  pendingVote: {
    messageId: string;
    target: "down" | "up";
  } | null;
  retryConversationError: () => void | Promise<void>;
  selectedModel: UltraChatbotAgentModel | undefined;
  setupMessage: string | null;
  showResumeThinking: boolean;
  showThinking: boolean;
  status: string;
  stop: () => void;
  submitStatus: ChatStatus;
  visibilityError: string | null;
  votesByMessageId: Record<string, boolean>;
}

export function UltraChatbotAgentChatPanel({
  chatMeta,
  composerError,
  editError,
  editingMessageId,
  editingRetainedFileUrls,
  editingText,
  error,
  hasMessages,
  initialSession,
  isBusy,
  isChatAvailable,
  isModelSelectorOpen,
  isSandboxUpdating,
  messages,
  models,
  onArtifactOpen,
  onCancelEdit,
  onComposerErrorChange,
  onEditTextChange,
  onModelChange,
  onModelSelectorOpenChange,
  onRemoveEditingFile,
  onSandboxApprovalResponse,
  onSaveEdit,
  onStartEdit,
  onSubmit,
  onVisibilityChange,
  onVisibilityError,
  onVote,
  pendingVote,
  retryConversationError,
  selectedModel,
  setupMessage,
  showResumeThinking,
  showThinking,
  status,
  stop,
  submitStatus,
  visibilityError,
  votesByMessageId,
}: UltraChatbotAgentChatPanelProps) {
  return (
    <section className="flex min-h-[70svh] min-w-0 flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
      {isChatAvailable ? null : (
        <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
          {setupMessage}
        </div>
      )}
      <UltraChatbotAgentChatAlerts
        composerError={composerError}
        editError={editError}
        visibilityError={visibilityError}
      />
      <UltraChatbotAgentChatHeader
        chatId={chatMeta.id}
        disabled={!(initialSession || hasMessages)}
        onVisibilityChange={onVisibilityChange}
        onVisibilityError={onVisibilityError}
        visibility={chatMeta.visibility}
      />
      <Conversation className="min-h-0 min-w-0">
        <ConversationContent className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 gap-6 px-4 py-6">
          {hasMessages || error ? (
            <>
              {hasMessages ? (
                <UltraChatbotAgentMessages
                  chatId={chatMeta.id}
                  editingMessageId={editingMessageId}
                  editingRetainedFileUrls={editingRetainedFileUrls}
                  editingText={editingText}
                  isBusy={isBusy}
                  isSandboxUpdating={isSandboxUpdating}
                  messages={messages}
                  onArtifactOpen={onArtifactOpen}
                  onCancelEdit={onCancelEdit}
                  onEditTextChange={onEditTextChange}
                  onRemoveEditingFile={onRemoveEditingFile}
                  onSandboxApprovalResponse={onSandboxApprovalResponse}
                  onSaveEdit={onSaveEdit}
                  onStartEdit={onStartEdit}
                  onVote={onVote}
                  pendingVote={pendingVote}
                  showResumeThinking={showResumeThinking}
                  showThinking={showThinking}
                  status={status}
                  votesByMessageId={votesByMessageId}
                />
              ) : null}
              {error ? (
                <ConversationErrorMessage
                  error={error}
                  isRetryDisabled={isBusy}
                  onRetry={retryConversationError}
                />
              ) : null}
            </>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-6 py-12">
              <ConversationEmptyState
                description="Start a conversation, switch models, then refresh the page to reload the same route-backed chat."
                icon={<RobotIcon className="size-5" />}
                title="Ultra route is ready"
              />
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <UltraChatbotAgentComposer
        chatMeta={chatMeta}
        disabled={!isChatAvailable || isBusy}
        hasMessages={hasMessages}
        isModelSelectorOpen={isModelSelectorOpen}
        models={models}
        onComposerErrorChange={onComposerErrorChange}
        onModelChange={onModelChange}
        onModelSelectorOpenChange={onModelSelectorOpenChange}
        onStop={stop}
        onSubmit={onSubmit}
        selectedModel={selectedModel}
        submitStatus={submitStatus}
      />
    </section>
  );
}

function UltraChatbotAgentChatAlerts({
  composerError,
  editError,
  visibilityError,
}: {
  composerError: string | null;
  editError: string | null;
  visibilityError: string | null;
}) {
  return (
    <>
      {editError ? (
        <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
          {editError}
        </div>
      ) : null}
      {composerError ? (
        <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
          {composerError}
        </div>
      ) : null}
      {visibilityError ? (
        <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
          {visibilityError}
        </div>
      ) : null}
    </>
  );
}

function UltraChatbotAgentChatHeader({
  chatId,
  disabled,
  onVisibilityChange,
  onVisibilityError,
  visibility,
}: {
  chatId: string;
  disabled: boolean;
  onVisibilityChange: (visibility: "private" | "public") => void;
  onVisibilityError: (message: string | null) => void;
  visibility: "private" | "public";
}) {
  return (
    <div className="border-foreground/10 border-b px-4 py-3">
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Conversation
          </p>
          <p className="mt-1 text-sm">
            Route-backed chat with visitor-owned state and resumable stream.
          </p>
        </div>
        <UltraChatbotAgentVisibilitySelector
          chatId={chatId}
          disabled={disabled}
          onChange={onVisibilityChange}
          onError={onVisibilityError}
          value={visibility}
        />
      </div>
    </div>
  );
}

function UltraChatbotAgentComposer({
  chatMeta,
  disabled,
  hasMessages,
  isModelSelectorOpen,
  models,
  onComposerErrorChange,
  onModelChange,
  onModelSelectorOpenChange,
  onSubmit,
  onStop,
  selectedModel,
  submitStatus,
}: {
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
  disabled: boolean;
  hasMessages: boolean;
  isModelSelectorOpen: boolean;
  models: UltraChatbotAgentModel[];
  onComposerErrorChange: (message: string | null) => void;
  onModelChange: (modelId: string) => void;
  onModelSelectorOpenChange: Dispatch<SetStateAction<boolean>>;
  onSubmit: (parts: UIMessage["parts"]) => Promise<void>;
  onStop: () => void;
  selectedModel: UltraChatbotAgentModel | undefined;
  submitStatus: ChatStatus;
}) {
  return (
    <div className="border-foreground/10 border-t px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        {hasMessages ? null : (
          <div className="mb-4">
            <UltraChatbotAgentSuggestedActions
              onSelect={(value) =>
                onSubmit([{ text: value, type: "text" as const }])
              }
            />
          </div>
        )}
        <UltraChatbotAgentMultimodalInput
          chatId={chatMeta.id}
          disabled={disabled}
          footerLeading={
            <>
              <Badge variant="outline">Visitor scoped</Badge>
              <Badge variant="outline">Blob uploads</Badge>
              <Badge variant="outline">Project Docs MCP</Badge>
              <Badge variant="outline">Preindexed RAG</Badge>
              <Badge variant="outline">
                {chatMeta.capabilities.sandboxEnabled
                  ? "Sandbox enabled"
                  : "Sandbox locked"}
              </Badge>
              <UltraChatbotAgentModelSelector
                isOpen={isModelSelectorOpen}
                models={models}
                onModelChange={onModelChange}
                onOpenChange={onModelSelectorOpenChange}
                selectedChatModel={chatMeta.selectedChatModel}
                selectedModel={selectedModel}
              />
            </>
          }
          onComposerErrorChange={onComposerErrorChange}
          onSend={onSubmit}
          onStop={onStop}
          placeholder="Ask for a draft, compare models, inspect project docs, query the preindexed PDF, and attach a PDF, PNG, or JPEG before sending."
          status={submitStatus}
        />
      </div>
    </div>
  );
}

function UltraChatbotAgentModelSelector({
  isOpen,
  models,
  onModelChange,
  onOpenChange,
  selectedChatModel,
  selectedModel,
}: {
  isOpen: boolean;
  models: UltraChatbotAgentModel[];
  onModelChange: (modelId: string) => void;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  selectedChatModel: string;
  selectedModel: UltraChatbotAgentModel | undefined;
}) {
  return (
    <ModelSelector onOpenChange={onOpenChange} open={isOpen}>
      <ModelSelectorTrigger className="inline-flex h-7 items-center gap-2 border border-input px-2 text-xs">
        <ModelSelectorLogo provider={selectedModel?.provider ?? "openai"} />
        <span>{selectedModel?.name ?? selectedChatModel}</span>
        <CaretDownIcon className="size-3" />
      </ModelSelectorTrigger>
      <ModelSelectorContent className="sm:max-w-md" title="Select model">
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          <ModelSelectorGroup heading="Available models">
            {models.map((model) => (
              <ModelSelectorItem
                key={model.id}
                onSelect={() => {
                  onModelChange(model.id);
                  onOpenChange(false);
                }}
                value={`${model.name} ${model.id}`}
              >
                <ModelSelectorLogo provider={model.provider} />
                <ModelSelectorName>{model.name}</ModelSelectorName>
                <span className="text-muted-foreground text-xs">
                  {model.capabilities.reasoning ? "Reasoning" : "Chat"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {model.expectedLatency} latency
                </span>
                <span className="text-muted-foreground text-xs">
                  {model.costProfile} cost
                </span>
              </ModelSelectorItem>
            ))}
          </ModelSelectorGroup>
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
