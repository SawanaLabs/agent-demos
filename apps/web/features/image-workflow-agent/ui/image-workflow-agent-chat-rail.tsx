"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@workspace/ui/components/ai-elements/prompt-input";
import {
  Suggestion,
  Suggestions,
} from "@workspace/ui/components/ai-elements/suggestion";
import type { ToolPart } from "@workspace/ui/components/ai-elements/tool";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
} from "@workspace/ui/components/ai-elements/tool";
import { Badge } from "@workspace/ui/components/badge";
import { type ChatStatus, isToolUIPart, type UIMessage } from "ai";

import { ConversationErrorMessage } from "@/features/shared/chat/ui/conversation-error-message";
import type { ImageResultNode } from "../model/workflow-engine";
import type { ImageWorkflowAgentSetupState } from "../server/env";
import { ImageWorkflowAgentMobileResult } from "./image-workflow-agent-mobile-result";
import {
  getSetupGuidanceLines,
  getWorkflowMessageText,
  getWorkflowToolDisplayOutput,
  getWorkflowToolTitle,
} from "./image-workflow-agent-model";

function WorkflowMessage({
  isStreaming,
  message,
}: {
  isStreaming: boolean;
  message: UIMessage;
}) {
  const text = getWorkflowMessageText(message);
  const toolParts = message.parts.filter(isToolUIPart) as ToolPart[];

  return (
    <Message from={message.role}>
      <MessageContent className="w-full max-w-full space-y-4">
        {text ? <MessageResponse>{text}</MessageResponse> : null}
        {toolParts.map((part) => (
          <Tool className="bg-muted/20" key={part.toolCallId}>
            {part.type === "dynamic-tool" ? (
              <ToolHeader
                state={part.state}
                title={part.toolName}
                toolName={part.toolName}
                type={part.type}
              />
            ) : (
              <ToolHeader
                state={part.state}
                title={getWorkflowToolTitle(part.type)}
                type={part.type}
              />
            )}
            <ToolContent>
              <ToolOutput
                errorText={part.errorText}
                output={getWorkflowToolDisplayOutput(part.output)}
              />
            </ToolContent>
          </Tool>
        ))}
        {!text && toolParts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {isStreaming
              ? "Working through the workflow."
              : "Waiting for visible output."}
          </p>
        ) : null}
      </MessageContent>
    </Message>
  );
}

function SetupGuidance({
  setupState,
}: {
  setupState: ImageWorkflowAgentSetupState;
}) {
  if (setupState.isReady) {
    return null;
  }

  return (
    <div
      className="space-y-2 border-foreground/10 border-b bg-muted/20 px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium">Setup required</p>
      {getSetupGuidanceLines(setupState.issues).map((issue) => (
        <p className="text-muted-foreground text-xs" key={issue}>
          {issue}
        </p>
      ))}
      <p className="break-all text-muted-foreground text-xs">
        Node: {setupState.nodeVersion} · Chat: {setupState.config.chatModel} ·
        Image: {setupState.config.imageModel}
      </p>
    </div>
  );
}

export interface ImageWorkflowAgentChatRailProps {
  chatError: Error | undefined;
  hasMessages: boolean;
  isBusy: boolean;
  isChatAvailable: boolean;
  manualError: string | null;
  messageStatus: ChatStatus;
  messages: UIMessage[];
  onRetryChatError: () => Promise<void> | void;
  onSend: (text: string) => Promise<void>;
  onSuggestionClick: (text: string) => Promise<void>;
  resultNode: ImageResultNode;
  setupState: ImageWorkflowAgentSetupState;
  status: "error" | "ready" | "setup required" | "streaming";
  suggestions: readonly string[];
}

export function ImageWorkflowAgentChatRail({
  chatError,
  hasMessages,
  isBusy,
  isChatAvailable,
  manualError,
  messages,
  messageStatus,
  onRetryChatError,
  onSend,
  onSuggestionClick,
  resultNode,
  setupState,
  status,
  suggestions,
}: ImageWorkflowAgentChatRailProps) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-foreground/10 bg-background">
      <div className="flex items-center justify-between border-foreground/10 border-b px-4 py-3">
        <div>
          <h2 className="font-medium text-sm">Workflow chat</h2>
          <p className="text-muted-foreground text-xs">
            Ask for graph edits or run the image workflow.
          </p>
        </div>
        <Badge variant="outline">{status}</Badge>
      </div>

      <ImageWorkflowAgentMobileResult resultNode={resultNode} />
      <SetupGuidance setupState={setupState} />

      <Conversation className="min-h-0">
        <ConversationContent className="gap-5 p-4">
          {hasMessages ? (
            messages.map((message, index) => (
              <WorkflowMessage
                isStreaming={isBusy && index === messages.length - 1}
                key={message.id}
                message={message}
              />
            ))
          ) : (
            <ConversationEmptyState
              description={
                isChatAvailable
                  ? "Use chat for higher-level workflow edits. The assistant must mutate the same validated graph you can edit manually."
                  : "Configure the required AI Gateway credentials before using workflow chat."
              }
              title={isChatAvailable ? "Chat is ready" : "Chat unavailable"}
            />
          )}
          {chatError ? (
            <ConversationErrorMessage
              error={chatError}
              isRetryDisabled={isBusy}
              onRetry={onRetryChatError}
            />
          ) : null}
          {manualError ? (
            <ConversationErrorMessage
              error={manualError}
              title="Workflow action failed"
            />
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-foreground/10 border-t px-4 py-4">
        <div className="space-y-3">
          <Suggestions>
            {suggestions.map((suggestion) => (
              <Suggestion
                disabled={!isChatAvailable || isBusy}
                key={suggestion}
                onClick={() => {
                  void onSuggestionClick(suggestion);
                }}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>

          <PromptInput
            onSubmit={({ text }) => {
              void onSend(text);
            }}
          >
            <PromptInputBody>
              <PromptInputTextarea
                disabled={!isChatAvailable || isBusy}
                placeholder="Ask the agent to edit the graph, adjust the prompt, or run the workflow."
              />
            </PromptInputBody>
            <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Graph-aware</Badge>
                <Badge variant="outline">One turn at a time</Badge>
              </div>
              <PromptInputSubmit
                disabled={!isChatAvailable}
                status={messageStatus}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </section>
  );
}
