"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { FileCodeIcon, FileTextIcon } from "@phosphor-icons/react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Badge } from "@/components/ui/badge";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import type { UltraChatbotAgentDocumentRecord } from "@/lib/ultra-chatbot-agent/server/document-store";
import { UltraChatbotAgentArtifactActions } from "./ultra-chatbot-agent-artifact-actions";
import {
  createUltraChatbotAgentScratchDocument,
  formatUltraChatbotAgentDocumentTimestamp,
  loadUltraChatbotAgentDocuments,
} from "./ultra-chatbot-agent-document-client";

function noopArtifactAction() {
  return;
}

export function UltraChatbotAgentDocumentBrowser({
  chatId,
  disabled,
  onOpen,
  refreshToken,
  selectedDocumentId,
}: {
  chatId: string;
  disabled: boolean;
  onOpen: (documentId: string) => void;
  refreshToken: number;
  selectedDocumentId: string | null;
}) {
  const [documents, setDocuments] = useState<UltraChatbotAgentDocumentRecord[]>(
    []
  );
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);

  const refreshDocuments = useCallback(async () => {
    setIsDocumentsLoading(true);

    try {
      setDocuments(await loadUltraChatbotAgentDocuments(chatId));
      setDocumentError(null);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Failed to load thread documents."
      );
    } finally {
      setIsDocumentsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (refreshToken < 0) {
      return;
    }

    refreshDocuments().catch(() => undefined);
  }, [refreshDocuments, refreshToken]);

  async function handleCreateScratchDocument() {
    setIsCreating(true);

    try {
      const document = await createUltraChatbotAgentScratchDocument(chatId);
      await refreshDocuments();
      onOpen(document.id);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Failed to create the scratch document."
      );
    } finally {
      setIsCreating(false);
    }
  }

  const documentGroups = [
    {
      documents: documents.filter((document) => document.kind === "code"),
      icon: FileCodeIcon,
      title: "Code",
    },
    {
      documents: documents.filter((document) => document.kind !== "code"),
      icon: FileTextIcon,
      title: "Documents",
    },
  ].filter((group) => group.documents.length > 0);

  let documentBrowserContent: ReactNode;

  if (isDocumentsLoading) {
    documentBrowserContent = (
      <Shimmer className="text-sm">Loading documents...</Shimmer>
    );
  } else if (documents.length === 0) {
    documentBrowserContent = (
      <div className="border border-foreground/10 border-dashed px-3 py-4 text-muted-foreground text-xs/relaxed">
        Create a scratch doc to exercise the versioned document route and the
        artifact dialog.
      </div>
    );
  } else {
    documentBrowserContent = (
      <div className="space-y-4">
        {documentGroups.map((group) => {
          const Icon = group.icon;

          return (
            <div className="space-y-2" key={group.title}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                {group.title}
              </p>
              {group.documents.map((document) => (
                <button
                  className="w-full border border-foreground/10 px-3 py-2 text-left transition-colors hover:border-foreground/30"
                  key={document.id}
                  onClick={() => onOpen(document.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span className="truncate text-sm">{document.title}</span>
                    </div>
                    {selectedDocumentId === document.id ? (
                      <Badge variant="secondary">Open</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {formatUltraChatbotAgentDocumentTimestamp(
                      document.createdAt
                    )}
                  </p>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Artifacts
          </p>
          <p className="mt-1 text-sm">
            Browse code and document artifacts created in this thread. Open one
            to inspect or edit it in a dedicated detail dialog.
          </p>
        </div>
        <UltraChatbotAgentArtifactActions
          canResetToLatest={false}
          disabled={disabled}
          hasSelectedDocument={false}
          isCreating={isCreating}
          isLatestVersion
          isSaving={false}
          onCreateScratchDocument={handleCreateScratchDocument}
          onResetToLatest={noopArtifactAction}
          onSaveVersion={noopArtifactAction}
        />
      </div>

      {documentError ? (
        <div className="text-destructive text-xs/relaxed">{documentError}</div>
      ) : null}

      {documentBrowserContent}
    </div>
  );
}
