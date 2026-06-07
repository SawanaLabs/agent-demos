"use client";

import { LinkIcon, TrashIcon } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { useState } from "react";

import type { UltraChatbotAgentChatRecord } from "../server/chat-store";

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function toConversationPath(chatId: string) {
  return `/demos/ultra-chatbot-agent/${chatId}`;
}

interface UltraChatbotAgentHistoryItemProps {
  chat: UltraChatbotAgentChatRecord;
  isActive: boolean;
  isDeleting?: boolean;
  onDelete?: (chat: UltraChatbotAgentChatRecord) => void;
}

export function UltraChatbotAgentHistoryItem({
  chat,
  isActive,
  isDeleting = false,
  onDelete,
}: UltraChatbotAgentHistoryItemProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 border text-sm transition-colors",
        isActive
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/10 hover:border-foreground/30"
      )}
    >
      <Link
        className="min-w-0 flex-1 px-3 py-2 text-left"
        href={toConversationPath(chat.id)}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <span className="line-clamp-2 min-w-0 break-words [overflow-wrap:anywhere]">
            {chat.title}
          </span>
          <LinkIcon className="mt-0.5 size-3.5 shrink-0" />
        </div>
        <p
          className={cn(
            "mt-2 text-[11px]",
            isActive ? "text-background/80" : "text-muted-foreground"
          )}
        >
          {formatDateTime(chat.updatedAt)}
        </p>
      </Link>
      {onDelete ? (
        <AlertDialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
          <Button
            aria-label={`Delete ${chat.title}`}
            className={cn(
              "m-1.5 shrink-0",
              isActive &&
                "border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground"
            )}
            disabled={isDeleting}
            onClick={() => setIsConfirmOpen(true)}
            size="icon-xs"
            type="button"
            variant="outline"
          >
            <TrashIcon className="size-3" />
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the conversation, votes, and thread artifacts for
                this visitor. The action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={() => {
                  setIsConfirmOpen(false);
                  onDelete(chat);
                }}
                variant="destructive"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
