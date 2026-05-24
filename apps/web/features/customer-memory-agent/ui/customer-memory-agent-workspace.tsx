"use client";

import {
  ArrowClockwiseIcon,
  DatabaseIcon,
  PlusIcon,
  RobotIcon,
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
import { useMemo } from "react";

import type { CustomerMemoryProfile } from "../customer-profiles";
import type { CustomerMemorySessionData } from "../session-data";
import {
  buildCustomerMemoryThreadLabel,
  formatCustomerMemoryCategory,
  getCustomerMemoryMessageText,
  getCustomerMemoryPendingCompaction,
  getCustomerMemorySamplePrompts,
  getCustomerMemoryToolParts,
  hasCustomerMemoryMessageContent,
} from "./customer-memory-session";
import { useCustomerMemorySession } from "./use-customer-memory-session";

const NODE_VERSION_PREFIX_PATTERN = /^v/;
const THREAD_SKELETON_KEYS = [
  "thread-skeleton-primary",
  "thread-skeleton-secondary",
  "thread-skeleton-tertiary",
] as const;

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

interface CustomerMemoryAgentWorkspaceProps {
  chatModel: string;
  compactionThreshold: number;
  customers: CustomerMemoryProfile[];
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

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

function CustomerMemoryThreadListSkeleton() {
  return (
    <div className="grid gap-2">
      {THREAD_SKELETON_KEYS.map((key) => (
        <div
          className="space-y-2 border border-foreground/10 px-3 py-3"
          key={key}
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-8" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function CustomerMemoryAccountContextSkeleton() {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Account context
      </p>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-9/12" />
      </div>
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

function buildSkeletonLineKeys(title: string, lineCount: number) {
  return Array.from(
    { length: lineCount },
    (_, index) => `${title}-line-${index + 1}`
  );
}

function CustomerMemoryPanelSkeleton(props: {
  title: string;
  lines?: number;
  withBadgeRow?: boolean;
}) {
  const lineCount = props.lines ?? 3;

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        {props.title}
      </p>
      <div className="space-y-2 border border-foreground/10 px-3 py-3">
        {props.withBadgeRow ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        ) : null}
        {buildSkeletonLineKeys(props.title, lineCount).map((key, index) => (
          <Skeleton
            className={cn("h-4", index === lineCount - 1 ? "w-4/5" : "w-full")}
            key={key}
          />
        ))}
      </div>
    </div>
  );
}

interface CustomerMemoryNavigationSidebarProps {
  activeThreadId: string | null;
  customerId: string;
  customers: CustomerMemoryProfile[];
  isBusy: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  onCreateThread: () => Promise<void>;
  onSelectCustomer: (customerId: string) => Promise<void>;
  onSelectThread: (threadId: string) => Promise<void>;
  session: CustomerMemorySessionData | null;
}

function CustomerMemoryNavigationSidebar({
  activeThreadId,
  customerId,
  customers,
  isBusy,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
  session,
  onCreateThread,
  onSelectCustomer,
  onSelectThread,
}: CustomerMemoryNavigationSidebarProps) {
  return (
    <aside className="grid content-start gap-4 border border-foreground/10 bg-background px-4 py-4">
      <CustomerMemoryCustomerList
        customerId={customerId}
        customers={customers}
        isBusy={isBusy}
        isSessionLoading={isSessionLoading}
        onSelectCustomer={onSelectCustomer}
      />
      <CustomerMemoryThreadList
        activeThreadId={activeThreadId}
        isBusy={isBusy}
        isReadonlyAccount={isReadonlyAccount}
        isReady={isReady}
        isSessionLoading={isSessionLoading}
        onCreateThread={onCreateThread}
        onSelectThread={onSelectThread}
        session={session}
      />
      <CustomerMemoryAccountContext
        isSessionLoading={isSessionLoading}
        session={session}
      />
    </aside>
  );
}

function CustomerMemoryCustomerList({
  customerId,
  customers,
  isBusy,
  isSessionLoading,
  onSelectCustomer,
}: {
  customerId: string;
  customers: CustomerMemoryProfile[];
  isBusy: boolean;
  isSessionLoading: boolean;
  onSelectCustomer: (customerId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Customers
      </p>
      <div className="grid gap-2">
        {customers.map((customer) => {
          const isActiveCustomer = customer.id === customerId;

          return (
            <button
              className={cn(
                "space-y-1 border px-3 py-3 text-left transition-colors",
                isActiveCustomer
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/10 hover:border-foreground/30"
              )}
              disabled={isBusy || isSessionLoading}
              key={customer.id}
              onClick={() => {
                onSelectCustomer(customer.id);
              }}
              type="button"
            >
              <p className="font-medium text-sm">{customer.name}</p>
              <div
                className={cn(
                  "flex items-center justify-between gap-2 text-xs/relaxed",
                  isActiveCustomer
                    ? "text-background/80"
                    : "text-muted-foreground"
                )}
              >
                <span>{customer.industry}</span>
                <span>
                  {customer.accessMode === "shared_readonly"
                    ? "Read only"
                    : "Writable"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomerMemoryThreadList({
  activeThreadId,
  isBusy,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
  session,
  onCreateThread,
  onSelectThread,
}: {
  activeThreadId: string | null;
  isBusy: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  session: CustomerMemorySessionData | null;
  onCreateThread: () => Promise<void>;
  onSelectThread: (threadId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          Threads
        </p>
        <Button
          disabled={!isReady || isBusy || isSessionLoading || isReadonlyAccount}
          onClick={() => {
            onCreateThread();
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <PlusIcon className="size-3.5" />
          New
        </Button>
      </div>

      <CustomerMemoryThreadListContent
        activeThreadId={activeThreadId}
        isBusy={isBusy}
        isSessionLoading={isSessionLoading}
        onSelectThread={onSelectThread}
        session={session}
      />
    </div>
  );
}

function CustomerMemoryThreadListContent({
  activeThreadId,
  isBusy,
  isSessionLoading,
  session,
  onSelectThread,
}: {
  activeThreadId: string | null;
  isBusy: boolean;
  isSessionLoading: boolean;
  session: CustomerMemorySessionData | null;
  onSelectThread: (threadId: string) => Promise<void>;
}) {
  if (isSessionLoading && !session) {
    return <CustomerMemoryThreadListSkeleton />;
  }

  if (!session?.threads.length) {
    return (
      <p className="text-muted-foreground text-sm/relaxed">
        No threads loaded yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {session.threads.map((thread, index) => {
        const isActiveThread = thread.id === activeThreadId;

        return (
          <button
            className={cn(
              "space-y-1 border px-3 py-3 text-left transition-colors",
              isActiveThread
                ? "border-foreground bg-muted/50"
                : "border-foreground/10 hover:border-foreground/30"
            )}
            disabled={isBusy || isSessionLoading}
            key={thread.id}
            onClick={() => {
              onSelectThread(thread.id);
            }}
            type="button"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">
                {buildCustomerMemoryThreadLabel({
                  fallbackIndex: index,
                  title: thread.title,
                })}
              </p>
              <Badge variant="outline">{thread.messageCount}</Badge>
            </div>
            <p className="text-muted-foreground text-xs/relaxed">
              Updated {formatShortDate(thread.updatedAt)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function CustomerMemoryAccountContext({
  isSessionLoading,
  session,
}: {
  isSessionLoading: boolean;
  session: CustomerMemorySessionData | null;
}) {
  if (isSessionLoading && !session) {
    return <CustomerMemoryAccountContextSkeleton />;
  }

  if (!session?.customer) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Account context
      </p>
      <p className="text-sm/relaxed">{session.customer.accountSummary}</p>
      <ul className="space-y-2 text-muted-foreground text-sm/relaxed">
        {session.customer.operatingNotes.map((note) => (
          <li key={note}>• {note}</li>
        ))}
      </ul>
    </div>
  );
}

interface CustomerMemoryChatPanelProps {
  chatErrorMessage: string | null;
  chatModel: string;
  compactionThreshold: number;
  isBusy: boolean;
  isChatAvailable: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  messages: UIMessage[];
  onRegenerateLastTurn: () => Promise<void>;
  onSendPrompt: (text: string) => Promise<void>;
  onStopChat: () => void;
  samplePrompts: string[];
  session: CustomerMemorySessionData | null;
  sessionErrorMessage: string | null;
  setupMessage: string | null;
  status: ChatStatus;
}

function CustomerMemoryChatPanel({
  chatErrorMessage,
  chatModel,
  compactionThreshold,
  isBusy,
  isChatAvailable,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
  messages,
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
    <section className="flex min-h-[74svh] flex-col border border-foreground/10 bg-background">
      {isChatAvailable ? null : (
        <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
          {setupMessage}
        </div>
      )}
      <CustomerMemoryErrorBanner message={sessionErrorMessage} />
      <CustomerMemoryErrorBanner message={chatErrorMessage} />
      <CustomerMemoryConversation
        compactionThreshold={compactionThreshold}
        isBusy={isBusy}
        isSessionLoading={isSessionLoading}
        messages={messages}
        onRegenerateLastTurn={onRegenerateLastTurn}
        session={session}
      />
      <CustomerMemoryComposer
        chatModel={chatModel}
        isBusy={isBusy}
        isReadonlyAccount={isReadonlyAccount}
        isReady={isReady}
        isSessionLoading={isSessionLoading}
        messages={messages}
        onRegenerateLastTurn={onRegenerateLastTurn}
        onSendPrompt={onSendPrompt}
        onStopChat={onStopChat}
        samplePrompts={samplePrompts}
        status={status}
      />
    </section>
  );
}

function CustomerMemoryErrorBanner({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
      {message}
    </div>
  );
}

function CustomerMemoryConversation({
  compactionThreshold,
  isBusy,
  isSessionLoading,
  messages,
  onRegenerateLastTurn,
  session,
}: {
  compactionThreshold: number;
  isBusy: boolean;
  isSessionLoading: boolean;
  messages: UIMessage[];
  onRegenerateLastTurn: () => Promise<void>;
  session: CustomerMemorySessionData | null;
}) {
  return (
    <Conversation>
      <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
        <CustomerMemoryConversationContent
          compactionThreshold={compactionThreshold}
          isBusy={isBusy}
          isSessionLoading={isSessionLoading}
          messages={messages}
          onRegenerateLastTurn={onRegenerateLastTurn}
          session={session}
        />
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

function CustomerMemoryConversationContent({
  compactionThreshold,
  isBusy,
  isSessionLoading,
  messages,
  onRegenerateLastTurn,
  session,
}: {
  compactionThreshold: number;
  isBusy: boolean;
  isSessionLoading: boolean;
  messages: UIMessage[];
  onRegenerateLastTurn: () => Promise<void>;
  session: CustomerMemorySessionData | null;
}) {
  if (messages.length === 0) {
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
          Compacting customer context…
        </Shimmer>
      ) : (
        <span className="shrink-0 font-medium">
          Context compacted · {messageCount} messages summarized
        </span>
      )}
    </Checkpoint>
  );
}

function CustomerMemoryComposer({
  chatModel,
  isBusy,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
  messages,
  samplePrompts,
  status,
  onRegenerateLastTurn,
  onSendPrompt,
  onStopChat,
}: {
  chatModel: string;
  isBusy: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  messages: UIMessage[];
  samplePrompts: string[];
  status: ChatStatus;
  onRegenerateLastTurn: () => Promise<void>;
  onSendPrompt: (text: string) => Promise<void>;
  onStopChat: () => void;
}) {
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
                !isReady || isBusy || isSessionLoading || isReadonlyAccount
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
                  disabled={isReadonlyAccount}
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
                disabled={!isReady || isBusy || isReadonlyAccount}
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
                  !isReady || isBusy || isSessionLoading || isReadonlyAccount
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

interface CustomerMemoryInsightsSidebarProps {
  compactionThreshold: number;
  isChatAvailable: boolean;
  isSessionLoading: boolean;
  latestPrompt: string;
  nodeVersion: string;
  onRefreshSession: (query?: string) => Promise<void>;
  session: CustomerMemorySessionData | null;
  viewState: {
    memoryEventCount: number;
    memoryCount: number;
    messageCount: number;
    relevantMemoryCount: number;
    threadCount: number;
  };
}

function CustomerMemoryInsightsSidebar({
  compactionThreshold,
  isChatAvailable,
  isSessionLoading,
  latestPrompt,
  nodeVersion,
  session,
  viewState,
  onRefreshSession,
}: CustomerMemoryInsightsSidebarProps) {
  return (
    <aside className="grid content-start gap-4 border border-foreground/10 bg-background px-4 py-4">
      <CustomerMemoryRuntimePanel
        compactionThreshold={compactionThreshold}
        isChatAvailable={isChatAvailable}
        nodeVersion={nodeVersion}
      />
      <CustomerMemorySessionStatePanel viewState={viewState} />
      <CustomerMemoryMemoriesPanel
        isSessionLoading={isSessionLoading}
        latestPrompt={latestPrompt}
        onRefreshSession={onRefreshSession}
        session={session}
      />
      <CustomerMemoryMemoryEventsPanel
        isSessionLoading={isSessionLoading}
        session={session}
      />
      <CustomerMemoryCompactionPanel
        isSessionLoading={isSessionLoading}
        session={session}
      />
      <CustomerMemoryPromptContextPanel
        isSessionLoading={isSessionLoading}
        latestPrompt={latestPrompt}
        session={session}
        viewState={viewState}
      />
    </aside>
  );
}

function CustomerMemoryRuntimePanel({
  compactionThreshold,
  isChatAvailable,
  nodeVersion,
}: {
  compactionThreshold: number;
  isChatAvailable: boolean;
  nodeVersion: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Runtime
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          {isChatAvailable ? "Ready" : "Setup required"}
        </Badge>
        <Badge variant="outline">
          Node {nodeVersion.replace(NODE_VERSION_PREFIX_PATTERN, "")}
        </Badge>
        <Badge variant="outline">{compactionThreshold} message threshold</Badge>
      </div>
    </div>
  );
}

function CustomerMemorySessionStatePanel({
  viewState,
}: {
  viewState: CustomerMemoryInsightsSidebarProps["viewState"];
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Session state
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{viewState.threadCount} threads</Badge>
        <Badge variant="outline">{viewState.messageCount} messages</Badge>
        <Badge variant="outline">{viewState.memoryCount} memories</Badge>
        <Badge variant="outline">{viewState.memoryEventCount} events</Badge>
      </div>
      <p className="text-muted-foreground text-sm/relaxed">
        The agent manages durable customer facts explicitly through the memory
        lifecycle tool. The chat thread is restored from Postgres whenever you
        switch back to the account.
      </p>
    </div>
  );
}

function CustomerMemoryMemoriesPanel({
  isSessionLoading,
  latestPrompt,
  session,
  onRefreshSession,
}: {
  isSessionLoading: boolean;
  latestPrompt: string;
  session: CustomerMemorySessionData | null;
  onRefreshSession: (query?: string) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          Saved memories
        </p>
        <Button
          onClick={() => {
            onRefreshSession(latestPrompt);
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <RobotIcon className="size-3.5" />
          Refresh
        </Button>
      </div>

      <CustomerMemoryMemoriesContent
        isSessionLoading={isSessionLoading}
        session={session}
      />
    </div>
  );
}

function CustomerMemoryMemoriesContent({
  isSessionLoading,
  session,
}: {
  isSessionLoading: boolean;
  session: CustomerMemorySessionData | null;
}) {
  if (isSessionLoading && !session) {
    return (
      <CustomerMemoryPanelSkeleton
        lines={4}
        title="Saved memories"
        withBadgeRow
      />
    );
  }

  if (!session?.memories.length) {
    return (
      <p className="text-muted-foreground text-sm/relaxed">
        No customer memories are active yet. Share a durable preference,
        promise, risk, or account fact and let the agent call its memory
        lifecycle tool.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {session.memories.map((memory) => {
        const isRelevant = session.relevantMemories.some(
          (candidate) => candidate.id === memory.id
        );

        return (
          <div
            className={cn(
              "space-y-2 border px-3 py-3",
              isRelevant
                ? "border-foreground/30 bg-muted/30"
                : "border-foreground/10"
            )}
            key={memory.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {formatCustomerMemoryCategory(memory.category)}
              </Badge>
              {memory.status === "updated" ? (
                <Badge variant="outline">Updated</Badge>
              ) : null}
              {isRelevant ? <Badge variant="outline">Recalled</Badge> : null}
            </div>
            <p className="font-medium text-sm">
              {memory.title?.trim() || "Untitled memory"}
            </p>
            <p className="text-sm/relaxed">{memory.content}</p>
            <p className="text-muted-foreground text-xs/relaxed">
              Updated {formatShortDate(memory.updatedAt)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CustomerMemoryMemoryEventsPanel({
  isSessionLoading,
  session,
}: {
  isSessionLoading: boolean;
  session: CustomerMemorySessionData | null;
}) {
  if (isSessionLoading && !session) {
    return <CustomerMemoryPanelSkeleton lines={3} title="Memory lifecycle" />;
  }

  if (!session?.memoryEvents.length) {
    return null;
  }

  return (
    <details className="group space-y-2 border border-foreground/10 px-3 py-3">
      <summary className="cursor-pointer list-none text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Memory lifecycle
      </summary>
      <div className="grid gap-2 pt-2">
        {session.memoryEvents.slice(0, 8).map((event) => (
          <div className="space-y-1 text-xs/relaxed" key={event.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {formatCustomerMemoryCategory(event.operation)}
              </Badge>
              <span className="text-muted-foreground">
                {formatShortDate(event.createdAt)}
              </span>
            </div>
            {event.reason ? (
              <p className="text-muted-foreground">{event.reason}</p>
            ) : null}
            {event.afterContent ? <p>{event.afterContent}</p> : null}
          </div>
        ))}
      </div>
    </details>
  );
}

function CustomerMemoryCompactionPanel({
  isSessionLoading,
  session,
}: {
  isSessionLoading: boolean;
  session: CustomerMemorySessionData | null;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Latest handoff
      </p>
      <CustomerMemoryCompactionContent
        isSessionLoading={isSessionLoading}
        session={session}
      />
    </div>
  );
}

function CustomerMemoryCompactionContent({
  isSessionLoading,
  session,
}: {
  isSessionLoading: boolean;
  session: CustomerMemorySessionData | null;
}) {
  if (isSessionLoading && !session) {
    return (
      <CustomerMemoryPanelSkeleton
        lines={3}
        title="Latest handoff"
        withBadgeRow
      />
    );
  }

  if (!session?.latestCompaction) {
    return (
      <p className="text-muted-foreground text-sm/relaxed">
        No handoff compaction exists yet. Once the thread reaches the threshold,
        older turns will be replaced by one saved handoff.
      </p>
    );
  }

  return (
    <div className="space-y-2 border border-foreground/10 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {session.latestCompaction.messageCount} messages compacted
        </Badge>
        <Badge variant="outline">
          {formatShortDate(session.latestCompaction.createdAt)}
        </Badge>
      </div>
      <p className="text-sm/relaxed">{session.latestCompaction.summary}</p>
    </div>
  );
}

function CustomerMemoryPromptContextPanel({
  isSessionLoading,
  latestPrompt,
  session,
  viewState,
}: {
  isSessionLoading: boolean;
  latestPrompt: string;
  session: CustomerMemorySessionData | null;
  viewState: CustomerMemoryInsightsSidebarProps["viewState"];
}) {
  if (isSessionLoading && !session) {
    return (
      <CustomerMemoryPanelSkeleton lines={2} title="Current prompt context" />
    );
  }

  if (!latestPrompt) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        Current prompt context
      </p>
      <div className="space-y-2 border border-foreground/10 px-3 py-3">
        <p className="text-sm/relaxed">{latestPrompt}</p>
        <p className="text-muted-foreground text-xs/relaxed">
          {viewState.relevantMemoryCount} saved memories were retrieved for the
          latest user turn.
        </p>
      </div>
    </div>
  );
}

export function CustomerMemoryAgentWorkspace({
  chatModel,
  compactionThreshold,
  customers,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: CustomerMemoryAgentWorkspaceProps) {
  const controller = useCustomerMemorySession(isChatAvailable);
  const samplePrompts = useMemo(
    () => getCustomerMemorySamplePrompts(controller.customerId),
    [controller.customerId]
  );

  return (
    <div className="grid min-h-[74svh] gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_22rem]">
      <CustomerMemoryNavigationSidebar
        activeThreadId={controller.activeThreadId}
        customerId={controller.customerId}
        customers={customers}
        isBusy={controller.isBusy}
        isReadonlyAccount={controller.isReadonlyAccount}
        isReady={controller.isReady}
        isSessionLoading={controller.isSessionLoading}
        onCreateThread={controller.createThread}
        onSelectCustomer={controller.selectCustomer}
        onSelectThread={controller.selectThread}
        session={controller.session}
      />
      <CustomerMemoryChatPanel
        chatErrorMessage={controller.chatErrorMessage}
        chatModel={chatModel}
        compactionThreshold={compactionThreshold}
        isBusy={controller.isBusy}
        isChatAvailable={isChatAvailable}
        isReadonlyAccount={controller.isReadonlyAccount}
        isReady={controller.isReady}
        isSessionLoading={controller.isSessionLoading}
        messages={controller.messages}
        onRegenerateLastTurn={controller.regenerateLastTurn}
        onSendPrompt={controller.sendPrompt}
        onStopChat={controller.stopChat}
        samplePrompts={samplePrompts}
        session={controller.session}
        sessionErrorMessage={controller.sessionErrorMessage}
        setupMessage={setupMessage}
        status={controller.status}
      />
      <CustomerMemoryInsightsSidebar
        compactionThreshold={compactionThreshold}
        isChatAvailable={isChatAvailable}
        isSessionLoading={controller.isSessionLoading}
        latestPrompt={controller.latestPrompt}
        nodeVersion={nodeVersion}
        onRefreshSession={controller.refreshSession}
        session={controller.session}
        viewState={controller.viewState}
      />
    </div>
  );
}
