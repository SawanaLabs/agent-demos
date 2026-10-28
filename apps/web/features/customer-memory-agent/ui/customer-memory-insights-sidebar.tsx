"use client";

import { RobotIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { PageText, usePageCopy } from "@/components/page-copy";

import type { CustomerMemorySessionData } from "../session-data";
import { formatCustomerMemoryCategory } from "./customer-memory-session";

const NODE_VERSION_PREFIX_PATTERN = /^v/;

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
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

interface CustomerMemoryInsightsViewState {
  memoryCount: number;
  memoryEventCount: number;
  messageCount: number;
  relevantMemoryCount: number;
  threadCount: number;
}

interface CustomerMemoryInsightsSidebarProps {
  compactionThreshold: number;
  isChatAvailable: boolean;
  isSessionLoading: boolean;
  latestPrompt: string;
  nodeVersion: string;
  onRefreshSession: (query?: string) => Promise<void>;
  session: CustomerMemorySessionData | null;
  viewState: CustomerMemoryInsightsViewState;
}

export function CustomerMemoryInsightsSidebar({
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
    <aside className="grid content-start gap-4 border border-foreground/10 bg-background px-4 py-4 xl:min-h-0 xl:overflow-y-auto">
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
        <PageText>{"Runtime"}</PageText>
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          <PageText>{isChatAvailable ? "Ready" : "Setup required"}</PageText>
        </Badge>
        <Badge variant="outline">
          <PageText>{"Node "}</PageText>
          {nodeVersion.replace(NODE_VERSION_PREFIX_PATTERN, "")}
        </Badge>
        <Badge variant="outline">
          {compactionThreshold}
          <PageText>{" message threshold"}</PageText>
        </Badge>
      </div>
    </div>
  );
}

function CustomerMemorySessionStatePanel({
  viewState,
}: {
  viewState: CustomerMemoryInsightsViewState;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        <PageText>{"Session state"}</PageText>
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          {viewState.threadCount}
          <PageText>{" threads"}</PageText>
        </Badge>
        <Badge variant="outline">
          {viewState.messageCount}
          <PageText>{" messages"}</PageText>
        </Badge>
        <Badge variant="outline">
          {viewState.memoryCount}
          <PageText>{" memories"}</PageText>
        </Badge>
        <Badge variant="outline">
          {viewState.memoryEventCount}
          <PageText>{" events"}</PageText>
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm/relaxed">
        <PageText>
          {
            "The agent manages durable customer facts explicitly through the memory lifecycle tool. The chat thread is restored from Postgres whenever you switch back to the account."
          }
        </PageText>
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
          <PageText>{"Saved memories"}</PageText>
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
          <PageText>{"Refresh"}</PageText>
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
  const pageCopy = usePageCopy();

  if (isSessionLoading && !session) {
    return (
      <CustomerMemoryPanelSkeleton
        lines={4}
        title={pageCopy("Saved memories")}
        withBadgeRow
      />
    );
  }

  if (!session?.memories.length) {
    return (
      <p className="text-muted-foreground text-sm/relaxed">
        <PageText>
          {
            "No customer memories are active yet. Share a durable preference, promise, risk, or account fact and let the agent call its memory lifecycle tool."
          }
        </PageText>
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
                <Badge variant="outline">
                  <PageText>{"Updated"}</PageText>
                </Badge>
              ) : null}
              {isRelevant ? (
                <Badge variant="outline">
                  <PageText>{"Recalled"}</PageText>
                </Badge>
              ) : null}
            </div>
            <p className="font-medium text-sm">
              {memory.title?.trim() || "Untitled memory"}
            </p>
            <p className="text-sm/relaxed">{memory.content}</p>
            <p className="text-muted-foreground text-xs/relaxed">
              <PageText>{"Updated "}</PageText>
              {formatShortDate(memory.updatedAt)}
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
  const pageCopy = usePageCopy();

  if (isSessionLoading && !session) {
    return (
      <CustomerMemoryPanelSkeleton
        lines={3}
        title={pageCopy("Memory lifecycle")}
      />
    );
  }

  if (!session?.memoryEvents.length) {
    return null;
  }

  return (
    <details className="group space-y-2 border border-foreground/10 px-3 py-3">
      <summary className="cursor-pointer list-none text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        <PageText>{"Memory lifecycle"}</PageText>
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
        <PageText>{"Latest handoff"}</PageText>
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
  const pageCopy = usePageCopy();

  if (isSessionLoading && !session) {
    return (
      <CustomerMemoryPanelSkeleton
        lines={3}
        title={pageCopy("Latest handoff")}
        withBadgeRow
      />
    );
  }

  if (!session?.latestCompaction) {
    return (
      <p className="text-muted-foreground text-sm/relaxed">
        <PageText>
          {
            "No handoff compaction exists yet. Once the thread reaches the threshold, older turns will be replaced by one saved handoff."
          }
        </PageText>
      </p>
    );
  }

  return (
    <div className="space-y-2 border border-foreground/10 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {session.latestCompaction.messageCount}
          <PageText>{" messages compacted"}</PageText>
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
  viewState: CustomerMemoryInsightsViewState;
}) {
  const pageCopy = usePageCopy();

  if (isSessionLoading && !session) {
    return (
      <CustomerMemoryPanelSkeleton
        lines={2}
        title={pageCopy("Current prompt context")}
      />
    );
  }

  if (!latestPrompt) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        <PageText>{"Current prompt context"}</PageText>
      </p>
      <div className="space-y-2 border border-foreground/10 px-3 py-3">
        <p className="text-sm/relaxed">{latestPrompt}</p>
        <p className="text-muted-foreground text-xs/relaxed">
          {viewState.relevantMemoryCount}
          <PageText>
            {" saved memories were retrieved for the latest user turn."}
          </PageText>
        </p>
      </div>
    </div>
  );
}
