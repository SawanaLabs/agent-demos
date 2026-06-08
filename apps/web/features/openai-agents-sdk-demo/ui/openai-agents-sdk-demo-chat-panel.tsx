"use client";

import { ArrowClockwiseIcon, RobotIcon, StopIcon } from "@phosphor-icons/react";
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
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@workspace/ui/components/ai-elements/reasoning";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { ChatAddToolApproveResponseFunction, ChatStatus } from "ai";

import type { OpenAiAgentsSdkDemoMessage } from "../message-metadata";
import {
  OpenAiAgentsSdkDemoAttachments,
  OpenAiAgentsSdkDemoErrorMessage,
  OpenAiAgentsSdkDemoSources,
  OpenAiAgentsSdkDemoToolParts,
  ThinkingState,
} from "./openai-agents-sdk-demo-chat-rendering";
import {
  getOpenAiAgentsSdkDemoFileParts,
  getOpenAiAgentsSdkDemoMessageText,
  getOpenAiAgentsSdkDemoRenderableReasoningText,
  getOpenAiAgentsSdkDemoSourceParts,
  getOpenAiAgentsSdkDemoToolParts,
  shouldRenderOpenAiAgentsSdkDemoReasoning,
} from "./openai-agents-sdk-demo-session";
import type { OpenAiAgentsSdkDemoChatError } from "./openai-agents-sdk-demo-workspace-types";

const openAiAgentsSdkDemoSamplePrompts = [
  "Explain how this demo bridges the OpenAI Agents SDK run into AI SDK UI messages.",
  "Run a short planning answer that uses the configured guide coverage and model profile.",
  "Summarize what the demo proves about tools, handoffs, and tracing in one response.",
] as const;

interface OpenAiAgentsSdkDemoChatPanelProps {
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
  chatErrorMessage: OpenAiAgentsSdkDemoChatError | null;
  chatModel: string;
  hasMessages: boolean;
  hasPendingApproval: boolean;
  isBusy: boolean;
  isChatAvailable: boolean;
  messages: OpenAiAgentsSdkDemoMessage[];
  onRegenerate: () => void | PromiseLike<void>;
  onRetryFailedTurn: (text: string) => void;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  setupMessage: string | null;
  status: ChatStatus;
}

export function OpenAiAgentsSdkDemoChatPanel({
  addToolApprovalResponse,
  chatErrorMessage,
  chatModel,
  hasMessages,
  hasPendingApproval,
  isBusy,
  isChatAvailable,
  messages,
  onRegenerate,
  onRetryFailedTurn,
  onSendMessage,
  onStop,
  setupMessage,
  status,
}: OpenAiAgentsSdkDemoChatPanelProps) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden border border-foreground/10 bg-background">
      {isChatAvailable ? null : (
        <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
          {setupMessage}
        </div>
      )}

      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
          {hasMessages ? (
            <OpenAiAgentsSdkDemoMessageList
              addToolApprovalResponse={addToolApprovalResponse}
              isBusy={isBusy}
              messages={messages}
            />
          ) : (
            <ConversationEmptyState
              description="Send a prompt and exercise the official OpenAI Agents SDK to AI SDK UI bridge without leaving the current frontend stack."
              icon={<RobotIcon className="size-5" />}
              title="OpenAI Agents workspace is ready"
            />
          )}
          {chatErrorMessage ? (
            <OpenAiAgentsSdkDemoErrorMessage
              error={chatErrorMessage}
              onRetry={onRetryFailedTurn}
            />
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <OpenAiAgentsSdkDemoComposer
        chatModel={chatModel}
        hasMessages={hasMessages}
        hasPendingApproval={hasPendingApproval}
        isBusy={isBusy}
        isChatAvailable={isChatAvailable}
        onRegenerate={onRegenerate}
        onSendMessage={onSendMessage}
        onStop={onStop}
        status={status}
      />
    </section>
  );
}

function OpenAiAgentsSdkDemoMessageList({
  addToolApprovalResponse,
  isBusy,
  messages,
}: {
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
  isBusy: boolean;
  messages: OpenAiAgentsSdkDemoMessage[];
}) {
  return messages.map((message, index) => (
    <OpenAiAgentsSdkDemoMessageItem
      addToolApprovalResponse={addToolApprovalResponse}
      index={index}
      isBusy={isBusy}
      key={message.id}
      message={message}
      messages={messages}
    />
  ));
}

function OpenAiAgentsSdkDemoMessageItem({
  addToolApprovalResponse,
  index,
  isBusy,
  message,
  messages,
}: {
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
  index: number;
  isBusy: boolean;
  message: OpenAiAgentsSdkDemoMessage;
  messages: OpenAiAgentsSdkDemoMessage[];
}) {
  const text = getOpenAiAgentsSdkDemoMessageText(message).trim();
  const nextMessage = messages[index + 1];
  const reasoningText = shouldRenderOpenAiAgentsSdkDemoReasoning(
    message,
    nextMessage
  )
    ? getOpenAiAgentsSdkDemoRenderableReasoningText(message).trim()
    : "";
  const sourceParts = getOpenAiAgentsSdkDemoSourceParts(message);
  const fileParts = getOpenAiAgentsSdkDemoFileParts(message);
  const toolParts = getOpenAiAgentsSdkDemoToolParts(message);
  const isLastMessage = index === messages.length - 1;
  const isMessageStreaming =
    message.role === "assistant" && isBusy && isLastMessage;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isMessageStreaming && lastPart?.type === "reasoning";
  const hasVisibleContent =
    text.length > 0 ||
    reasoningText.length > 0 ||
    sourceParts.length > 0 ||
    fileParts.length > 0 ||
    toolParts.length > 0;
  const showThinking =
    message.role === "assistant" && isMessageStreaming && !hasVisibleContent;

  return (
    <Message from={message.role}>
      <MessageContent
        className={cn(
          "space-y-4",
          message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
        )}
      >
        {reasoningText ? (
          <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoningText}</ReasoningContent>
          </Reasoning>
        ) : null}
        <OpenAiAgentsSdkDemoToolParts
          isMessageStreaming={isMessageStreaming}
          onApprovalResponse={addToolApprovalResponse}
          toolParts={toolParts}
        />
        {text ? <MessageResponse>{text}</MessageResponse> : null}
        <OpenAiAgentsSdkDemoSources sources={sourceParts} />
        <OpenAiAgentsSdkDemoAttachments
          fileParts={fileParts}
          messageId={message.id}
        />
        {showThinking ? <ThinkingState /> : null}
        {hasVisibleContent ||
        (message.role === "assistant" && isMessageStreaming) ? null : (
          <p className="text-muted-foreground text-sm/relaxed">
            No visible assistant output was returned for this turn.
          </p>
        )}
      </MessageContent>
    </Message>
  );
}

function OpenAiAgentsSdkDemoComposer({
  chatModel,
  hasMessages,
  hasPendingApproval,
  isBusy,
  isChatAvailable,
  onRegenerate,
  onSendMessage,
  onStop,
  status,
}: {
  chatModel: string;
  hasMessages: boolean;
  hasPendingApproval: boolean;
  isBusy: boolean;
  isChatAvailable: boolean;
  onRegenerate: () => void | PromiseLike<void>;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  status: ChatStatus;
}) {
  return (
    <div className="border-foreground/10 border-t px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        <PromptInput onSubmit={({ text }) => onSendMessage(text)}>
          <PromptInputBody>
            <PromptInputTextarea
              disabled={!isChatAvailable || isBusy || hasPendingApproval}
              placeholder={
                hasPendingApproval
                  ? "Approve or reject the pending tool request to continue this run."
                  : "Ask for a plan, a short explanation, or a demo-specific agent answer."
              }
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">OpenAI Agents SDK</Badge>
              <Badge variant="outline">AI SDK UI bridge</Badge>
              <Badge variant="outline">{chatModel}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {isBusy ? (
                <Button
                  onClick={onStop}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <StopIcon className="size-3.5" />
                  Stop
                </Button>
              ) : null}
              {hasMessages ? (
                <Button
                  onClick={() => {
                    onRegenerate();
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ArrowClockwiseIcon className="size-3.5" />
                  Retry
                </Button>
              ) : null}
              <PromptInputSubmit
                disabled={!isChatAvailable || hasPendingApproval}
                status={status}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>

        {hasMessages ? null : (
          <div className="mt-3 flex flex-wrap gap-2">
            {openAiAgentsSdkDemoSamplePrompts.map((prompt) => (
              <Button
                disabled={!isChatAvailable || hasPendingApproval || isBusy}
                key={prompt}
                onClick={() => onSendMessage(prompt)}
                size="sm"
                type="button"
                variant="outline"
              >
                <RobotIcon className="size-3.5" />
                {prompt}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
