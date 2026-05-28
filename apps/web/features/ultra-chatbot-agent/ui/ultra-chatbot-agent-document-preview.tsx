"use client";

import {
  ArrowsOutSimpleIcon,
  FileCodeIcon,
  FileImageIcon,
  FileTextIcon,
  RowsIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import type { UltraChatbotAgentDocumentRecord } from "../server/document-store";
import { loadUltraChatbotAgentLatestDocument } from "./ultra-chatbot-agent-document-client";
import type { UltraChatbotAgentDocumentToolResult } from "./ultra-chatbot-agent-message-parts";

function getDocumentKindLabel(
  kind: UltraChatbotAgentDocumentToolResult["kind"]
) {
  switch (kind) {
    case "code":
      return "Code";
    case "image":
      return "Image";
    case "sheet":
      return "Sheet";
    default:
      return "Document";
  }
}

function getDocumentKindIcon(
  kind: UltraChatbotAgentDocumentToolResult["kind"]
) {
  switch (kind) {
    case "code":
      return FileCodeIcon;
    case "image":
      return FileImageIcon;
    case "sheet":
      return RowsIcon;
    default:
      return FileTextIcon;
  }
}

export function UltraChatbotAgentDocumentPreview({
  chatId,
  onOpen,
  result,
}: {
  chatId: string;
  onOpen: (documentId: string) => void;
  result: UltraChatbotAgentDocumentToolResult;
}) {
  const [document, setDocument] =
    useState<UltraChatbotAgentDocumentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setError(null);
    setDocument(null);

    loadUltraChatbotAgentLatestDocument(chatId, result.id)
      .then((nextDocument) => {
        if (isCancelled) {
          return;
        }

        setDocument(nextDocument);
      })
      .catch((loadError) => {
        if (isCancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load the inline document preview."
        );
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [chatId, result.id]);

  const previewDocument = document ?? {
    chatId,
    content: null,
    createdAt: "",
    id: result.id,
    kind: result.kind as UltraChatbotAgentDocumentRecord["kind"],
    title: result.title,
    visitorId: "",
  };
  const Icon = useMemo(
    () => getDocumentKindIcon(previewDocument.kind),
    [previewDocument.kind]
  );
  const previewText =
    previewDocument.content?.trim().replace(/\s+/g, " ").slice(0, 220) ?? "";
  let previewBody: ReactNode;

  if (isLoading) {
    previewBody = (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-[88%]" />
      </div>
    );
  } else if (previewText) {
    previewBody = (
      <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">
        {previewText}
      </p>
    );
  } else {
    previewBody = (
      <p className="text-muted-foreground text-sm">
        Open this artifact to keep editing it in the detail dialog.
      </p>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-destructive/30 px-4 py-3 text-destructive text-sm">
        {error}
      </div>
    );
  }

  return (
    <button
      className={cn(
        "w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-foreground/10 text-left transition-colors hover:border-foreground/30",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30"
      )}
      onClick={() => onOpen(result.id)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3 border-foreground/10 border-b px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="text-muted-foreground">
            {isLoading ? (
              <SpinnerGapIcon className="size-4 animate-spin" />
            ) : (
              <Icon className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="break-words font-medium text-sm leading-6 [overflow-wrap:anywhere]">
              {previewDocument.title}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              {getDocumentKindLabel(previewDocument.kind)}
            </p>
          </div>
        </div>
        <ArrowsOutSimpleIcon className="size-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="min-h-36 bg-muted/30 px-4 py-4">{previewBody}</div>
    </button>
  );
}
