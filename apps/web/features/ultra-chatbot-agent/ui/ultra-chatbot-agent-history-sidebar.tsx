"use client";

import { ArrowClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  UltraChatbotAgentChatRecord,
  UltraChatbotAgentHistoryPage,
} from "../server/chat-store";
import { UltraChatbotAgentHistoryItem } from "./ultra-chatbot-agent-history-item";

function toRootPath() {
  return "/demos/ultra-chatbot-agent";
}

async function loadHistoryPage(input: {
  endingBefore: string | null;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (input.limit) {
    searchParams.set("limit", String(input.limit));
  }

  if (input.endingBefore) {
    searchParams.set("ending_before", input.endingBefore);
  }

  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/history?${searchParams.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load chat history.");
  }

  return (await response.json()) as UltraChatbotAgentHistoryPage;
}

async function deleteAllHistory() {
  const response = await fetch("/api/demos/ultra-chatbot-agent/history", {
    credentials: "include",
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete chat history.");
  }
}

async function deleteHistoryChat(chatId: string) {
  const response = await fetch(`/api/demos/ultra-chatbot-agent/${chatId}`, {
    credentials: "include",
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete this chat.");
  }
}

function mergeChatIntoHistory(
  chats: UltraChatbotAgentChatRecord[],
  incoming: UltraChatbotAgentChatRecord
) {
  const next = chats.filter((chat) => chat.id !== incoming.id);
  return [incoming, ...next];
}

interface UltraChatbotAgentHistorySidebarProps {
  currentChatId: string;
  currentChatRecordHint: UltraChatbotAgentChatRecord | null;
  initialHistoryPage: UltraChatbotAgentHistoryPage;
}

export function UltraChatbotAgentHistorySidebar({
  currentChatId,
  currentChatRecordHint,
  initialHistoryPage,
}: UltraChatbotAgentHistorySidebarProps) {
  const router = useRouter();
  const [historyPage, setHistoryPage] = useState(initialHistoryPage);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentChatRecordHint) {
      return;
    }

    setHistoryPage((current) => ({
      ...current,
      chats: mergeChatIntoHistory(current.chats, currentChatRecordHint),
    }));
  }, [currentChatRecordHint]);

  async function handleLoadMore() {
    const lastChat = historyPage.chats.at(-1);

    if (!lastChat) {
      return;
    }

    setHistoryError(null);
    setIsLoadingMore(true);

    try {
      const nextPage = await loadHistoryPage({
        endingBefore: lastChat.id,
        limit: 10,
      });

      setHistoryPage((current) => ({
        chats: [...current.chats, ...nextPage.chats],
        hasMore: nextPage.hasMore,
      }));
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Failed to load chat history."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleDeleteAll() {
    setHistoryError(null);
    setIsDeleting(true);

    try {
      await deleteAllHistory();
      setHistoryPage({
        chats: [],
        hasMore: false,
      });
      window.location.replace(toRootPath());
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Failed to delete chat history."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteChat(chat: UltraChatbotAgentChatRecord) {
    setHistoryError(null);
    setDeletingChatId(chat.id);

    try {
      await deleteHistoryChat(chat.id);
      setHistoryPage((current) => ({
        ...current,
        chats: current.chats.filter(
          (currentChat) => currentChat.id !== chat.id
        ),
      }));

      if (chat.id === currentChatId) {
        window.location.replace(toRootPath());
      } else {
        router.refresh();
      }
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Failed to delete this chat."
      );
    } finally {
      setDeletingChatId(null);
    }
  }

  return (
    <aside className="border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              History
            </p>
            <p className="mt-1 font-medium text-sm">Visitor-owned chats</p>
          </div>
          <Badge variant="outline">{historyPage.chats.length}</Badge>
        </div>

        <div className="flex gap-2">
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href={toRootPath()}
          >
            New chat
          </Link>
          <Button
            disabled={isDeleting || historyPage.chats.length === 0}
            onClick={handleDeleteAll}
            size="sm"
            type="button"
            variant="outline"
          >
            <TrashIcon className="size-3.5" />
            Clear all
          </Button>
        </div>

        {historyError ? (
          <p className="text-destructive text-xs/relaxed">{historyError}</p>
        ) : null}

        <div className="grid gap-2">
          {historyPage.chats.length > 0 ? (
            historyPage.chats.map((chat) => (
              <UltraChatbotAgentHistoryItem
                chat={chat}
                isActive={chat.id === currentChatId}
                isDeleting={deletingChatId === chat.id}
                key={chat.id}
                onDelete={handleDeleteChat}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No persisted chats for this visitor yet.
            </p>
          )}
        </div>

        {historyPage.hasMore ? (
          <Button
            disabled={isLoadingMore}
            onClick={handleLoadMore}
            size="sm"
            type="button"
            variant="outline"
          >
            <ArrowClockwiseIcon className="size-3.5" />
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
