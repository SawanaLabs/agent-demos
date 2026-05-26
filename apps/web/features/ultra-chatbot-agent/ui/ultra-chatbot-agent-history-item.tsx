"use client";

import { LinkIcon } from "@phosphor-icons/react";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";

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
}

export function UltraChatbotAgentHistoryItem({
  chat,
  isActive,
}: UltraChatbotAgentHistoryItemProps) {
  return (
    <Link
      className={cn(
        "border px-3 py-2 text-left text-sm transition-colors",
        isActive
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/10 hover:border-foreground/30"
      )}
      href={toConversationPath(chat.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="line-clamp-2">{chat.title}</span>
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
  );
}
