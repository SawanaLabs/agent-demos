"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";

import type { CustomerMemoryProfile } from "../customer-profiles";
import type { CustomerMemorySessionData } from "../session-data";
import { buildCustomerMemoryThreadLabel } from "./customer-memory-session";

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

export function CustomerMemoryNavigationSidebar({
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
    <aside className="grid content-start gap-4 border border-foreground/10 bg-background px-4 py-4 xl:min-h-0 xl:overflow-y-auto">
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
          <li key={note}>- {note}</li>
        ))}
      </ul>
    </div>
  );
}
