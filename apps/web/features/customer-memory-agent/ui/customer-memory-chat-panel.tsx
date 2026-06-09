"use client";

import {
  ArrowClockwiseIcon,
  DatabaseIcon,
  ScrollIcon,
  StopIcon,
} from "@phosphor-icons/react";
import { Checkpoint } from "@workspace/ui/components/ai-elements/checkpoint";
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
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@workspace/ui/components/ai-elements/tool";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import type { ChatStatus, UIMessage } from "ai";

import { ConversationErrorMessage } from "@/features/shared/chat/ui/conversation-error-message";

import type { CustomerMemorySessionData } from "../session-data";
import { CustomerMemoryManualCompactAction } from "./customer-memory-manual-compact-action";
import {
  getCustomerMemoryMessageText,
  getCustomerMemoryPendingCompaction,
  getCustomerMemoryToolParts,
  hasCustomerMemoryMessageContent,
} from "./customer-memory-session";

interface AssistantMessageTraceProps {
  isStreaming: boolean;
  message: UIMessage;
  onRetryTurn: () => Promise<void>;
}

function AssistantMessageTrace({
  isStreaming,
  message,
  onRetryTurn,
}: AssistantMessageTraceProps) {
  const text = getCustomerMemoryMessageText(message);
  const toolParts = getCustomerMemoryToolParts(message);

  return (
    <>
      {toolParts.map((part) => (
        <AssistantToolTrace key={part.toolCallId} part={part} />
      ))}

      <AssistantMessageText
        isStreaming={isStreaming}
        onRetryTurn={onRetryTurn}
        text={text}
      />
    </>
  );
}

function getCustomerMemoryToolName(part: ToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}

function AssistantToolTrace({ part }: { part: ToolPart }) {
  const toolName = getCustomerMemoryToolName(part);

  return (
    <Tool>
      {part.type === "dynamic-tool" ? (
        <ToolHeader
          state={part.state}
          title={toolName}
          toolName={toolName}
          type={part.type}
        />
      ) : (
        <ToolHeader state={part.state} title={toolName} type={part.type} />
      )}
      <ToolContent>
        {part.input ? <ToolInput input={part.input} /> : null}
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
  );
}

function AssistantMessageText({
  isStreaming,
  onRetryTurn,
  text,
}: {
  isStreaming: boolean;
  onRetryTurn: () => Promise<void>;
  text: string;
}) {
  if (text.length > 0) {
    return <MessageResponse>{text}</MessageResponse>;
  }

  if (isStreaming) {
    return <Shimmer className="text-sm">Thinking...</Shimmer>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
      <span>Something went wrong while the agent was working.</span>
      <Button
        onClick={() => {
          onRetryTurn();
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <ArrowClockwiseIcon className="size-3.5" />
        Retry turn
      </Button>
    </div>
  );
}

function CustomerMemoryConversationSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="ml-auto max-w-2xl space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-[28rem] max-w-full" />
      </div>
      <div className="max-w-3xl space-y-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-20 w-[34rem] max-w-full" />
        <Skeleton className="h-28 w-[30rem] max-w-full" />
      </div>
    </div>
  );
}

interface CustomerMemoryChatPanelProps {
  chatErrorMessage: string | null;
  chatModel: string;
  compactionThreshold: number;
  isBusy: boolean;
  isChatAvailable: boolean;
  isCompactingContext: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  messages: UIMessage[];
  onCompactContext: () => Promise<void>;
  onRegenerateLastTurn: () => Promise<void>;
  onSendPrompt: (text: string) => Promise<void>;
  onStopChat: () => void;
  samplePrompts: string[];
  session: CustomerMemorySessionData | null;
  sessionErrorMessage: string | null;
  setupMessage: string | null;
  status: ChatStatus;
}

export function CustomerMemoryChatPanel({
  chatErrorMessage,
  chatModel,
  compactionThreshold,
  isBusy,
  isChatAvailable,
  isCompactingContext,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
  messages,
  onCompactContext,
  samplePrompts,
  session,
  sessionErrorMessage,
  setupMessage,
  status,
  onRegenerateLastTurn,
  onSendPrompt,
  onStopChat,
}: CustomerMemoryChatPanelProps) {
  return (
    <section className="flex min-h-[74svh] flex-col border border-foreground/10 bg-background xl:h-full xl:min-h-0">
      {isChatAvailable ? null : (
        <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
          {setupMessage}
        </div>
      )}
      <CustomerMemoryConversation
        chatErrorMessage={chatErrorMessage}
        compactionThreshold={compactionThreshold}
        isBusy={isBusy}
        isSessionLoading={isSessionLoading}
        messages={messages}
        onRegenerateLastTurn={onRegenerateLastTurn}
        session={session}
        sessionErrorMessage={sessionErrorMessage}
      />
      <CustomerMemoryComposer
        chatModel={chatModel}
        compactionThreshold={compactionThreshold}
        isBusy={isBusy}
        isCompactingContext={isCompactingContext}
        isReadonlyAccount={isReadonlyAccount}
        isReady={isReady}
        isSessionLoading={isSessionLoading}
        latestCompactionMessageCount={
          session?.latestCompaction?.messageCount ?? null
        }
        messages={messages}
        onCompactContext={onCompactContext}
        onRegenerateLastTurn={onRegenerateLastTurn}
        onSendPrompt={onSendPrompt}
        onStopChat={onStopChat}
        samplePrompts={samplePrompts}
        status={status}
      />
    </section>
  );
}

function CustomerMemoryConversation({
  chatErrorMessage,
  compactionThreshold,
  isBusy,
  isSessionLoading,
  messages,
  onRegenerateLastTurn,
  session,
  sessionErrorMessage,
}: {
  chatErrorMessage: string | null;
  compactionThreshold: number;
  isBusy: boolean;
  isSessionLoading: boolean;
  messages: UIMessage[];
  onRegenerateLastTurn: () => Promise<void>;
  session: CustomerMemorySessionData | null;
  sessionErrorMessage: string | null;
}) {
  return (
    <Conversation className="min-h-0">
      <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
        <CustomerMemoryConversationContent
          chatErrorMessage={chatErrorMessage}
          compactionThreshold={compactionThreshold}
          isBusy={isBusy}
          isSessionLoading={isSessionLoading}
          messages={messages}
          onRegenerateLastTurn={onRegenerateLastTurn}
          session={session}
          sessionErrorMessage={sessionErrorMessage}
        />
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

function CustomerMemoryConversationContent({
  chatErrorMessage,
  compactionThreshold,
  isBusy,
  isSessionLoading,
  messages,
  onRegenerateLastTurn,
  session,
  sessionErrorMessage,
}: {
  chatErrorMessage: string | null;
  compactionThreshold: number;
  isBusy: boolean;
  isSessionLoading: boolean;
  messages: UIMessage[];
  onRegenerateLastTurn: () => Promise<void>;
  session: CustomerMemorySessionData | null;
  sessionErrorMessage: string | null;
}) {
  const hasErrors = Boolean(chatErrorMessage || sessionErrorMessage);

  if (messages.length === 0 && !hasErrors) {
    if (isSessionLoading) {
      return <CustomerMemoryConversationSkeleton />;
    }

    return (
      <ConversationEmptyState
        description="Talk to one customer thread, let the agent write durable memories through a tool call, then inspect the saved memories and handoff compaction on the right."
        icon={<DatabaseIcon className="size-5" />}
        title="Customer memory workspace is ready"
      />
    );
  }

  const completedCompactionMessageCount =
    session?.latestCompaction?.messageCount ?? null;
  const displayMessages = messages.filter(
    (message, index) =>
      message.role !== "assistant" ||
      hasCustomerMemoryMessageContent(message) ||
      index === messages.length - 1
  );
  const latestMessage = messages.at(-1);
  const compactionMessageCount = displayMessages.filter(
    hasCustomerMemoryMessageContent
  ).length;
  const pendingCompaction = getCustomerMemoryPendingCompaction({
    compactionThreshold,
    isSessionLoading,
    latestCompactionMessageCount: completedCompactionMessageCount,
    messageCount: compactionMessageCount,
  });

  return (
    <>
      {displayMessages.map((message, index) => {
        const isLastAssistantMessage =
          message.role === "assistant" && message === latestMessage && isBusy;
        const shouldShowCompletedCompaction =
          completedCompactionMessageCount === index + 1;

        return (
          <div className="contents" key={message.id}>
            <Message from={message.role}>
              <MessageContent
                className={cn(
                  "space-y-4",
                  message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                )}
              >
                {message.role === "assistant" ? (
                  <AssistantMessageTrace
                    isStreaming={isLastAssistantMessage}
                    message={message}
                    onRetryTurn={onRegenerateLastTurn}
                  />
                ) : (
                  <MessageResponse>
                    {getCustomerMemoryMessageText(message)}
                  </MessageResponse>
                )}
              </MessageContent>
            </Message>
            {shouldShowCompletedCompaction ? (
              <CustomerMemoryContextCheckpoint
                messageCount={completedCompactionMessageCount}
                state="completed"
              />
            ) : null}
          </div>
        );
      })}
      {sessionErrorMessage ? (
        <ConversationErrorMessage
          error={sessionErrorMessage}
          title="Customer memory session failed"
        />
      ) : null}
      {chatErrorMessage ? (
        <ConversationErrorMessage
          error={chatErrorMessage}
          isRetryDisabled={isBusy}
          onRetry={onRegenerateLastTurn}
        />
      ) : null}
      {pendingCompaction ? (
        <CustomerMemoryContextCheckpoint
          messageCount={pendingCompaction.messageCount}
          state="pending"
        />
      ) : null}
    </>
  );
}

function CustomerMemoryContextCheckpoint({
  messageCount,
  state,
}: {
  messageCount: number;
  state: "completed" | "pending";
}) {
  return (
    <Checkpoint className="my-1 w-full gap-2 text-muted-foreground text-xs">
      <span className="h-px flex-1 bg-border" />
      <ScrollIcon className="size-4 shrink-0" />
      {state === "pending" ? (
        <Shimmer className="shrink-0 font-medium">
          Compacting customer context...
        </Shimmer>
      ) : (
        <span className="shrink-0 font-medium">
          Context compacted - {messageCount} messages summarized
        </span>
      )}
    </Checkpoint>
  );
}

function CustomerMemoryComposer({
  chatModel,
  compactionThreshold,
  isBusy,
  isCompactingContext,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
  latestCompactionMessageCount,
  messages,
  samplePrompts,
  status,
  onCompactContext,
  onRegenerateLastTurn,
  onSendPrompt,
  onStopChat,
}: {
  chatModel: string;
  compactionThreshold: number;
  isBusy: boolean;
  isCompactingContext: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  latestCompactionMessageCount: number | null;
  messages: UIMessage[];
  samplePrompts: string[];
  status: ChatStatus;
  onCompactContext: () => Promise<void>;
  onRegenerateLastTurn: () => Promise<void>;
  onSendPrompt: (text: string) => Promise<void>;
  onStopChat: () => void;
}) {
  const compactionMessageCount = messages.filter(
    hasCustomerMemoryMessageContent
  ).length;

  return (
    <div className="border-foreground/10 border-t px-4 py-4">
      <div className="mx-auto w-full max-w-3xl space-y-3">
        <PromptInput
          onSubmit={({ text }) => {
            onSendPrompt(text);
          }}
        >
          <PromptInputBody>
            <PromptInputTextarea
              disabled={
                !isReady ||
                isBusy ||
                isCompactingContext ||
                isSessionLoading ||
                isReadonlyAccount
              }
              placeholder={
                isReadonlyAccount
                  ? "This demo account is read-only. Switch to Demo Sandbox to create your own private thread."
                  : "Ask for an update, share a durable customer fact, or tell the agent about a promise that should be remembered later."
              }
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Persistent thread</Badge>
              <Badge variant="outline">Agent memory tool</Badge>
              <Badge variant="outline">{chatModel}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CustomerMemoryManualCompactAction
                compactionThreshold={compactionThreshold}
                isBusy={isBusy}
                isCompactingContext={isCompactingContext}
                isReadonlyAccount={isReadonlyAccount}
                isReady={isReady}
                isSessionLoading={isSessionLoading}
                latestCompactionMessageCount={latestCompactionMessageCount}
                messageCount={compactionMessageCount}
                onCompactContext={onCompactContext}
              />
              {isBusy ? (
                <Button
                  onClick={onStopChat}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <StopIcon className="size-3.5" />
                  Stop
                </Button>
              ) : null}
              {messages.length > 0 ? (
                <Button
                  disabled={isCompactingContext || isReadonlyAccount}
                  onClick={() => {
                    onRegenerateLastTurn();
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
                disabled={
                  !isReady || isBusy || isCompactingContext || isReadonlyAccount
                }
                status={status}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>

        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt) => (
              <Button
                className="max-w-full justify-start text-left"
                disabled={
                  !isReady ||
                  isBusy ||
                  isCompactingContext ||
                  isSessionLoading ||
                  isReadonlyAccount
                }
                key={prompt}
                onClick={() => {
                  onSendPrompt(prompt);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                {prompt}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
