"use client";

import { FileTextIcon } from "@phosphor-icons/react";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import { Badge } from "@workspace/ui/components/badge";
import { useCallback, useEffect, useState } from "react";

import type { UltraChatbotAgentDocumentRecord } from "../server/document-store";
import { UltraChatbotAgentArtifactActions } from "./ultra-chatbot-agent-artifact-actions";
import {
  createUltraChatbotAgentScratchDocument,
  formatUltraChatbotAgentDocumentTimestamp,
  loadUltraChatbotAgentDocuments,
} from "./ultra-chatbot-agent-document-client";

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
    void refreshDocuments();
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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Documents
          </p>
          <p className="mt-1 text-sm">
            Browse artifacts created in this thread. Open one to inspect or
            edit it in a dedicated detail dialog.
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
          onResetToLatest={() => {}}
          onSaveVersion={() => {}}
        />
      </div>

      {documentError ? (
        <div className="text-destructive text-xs/relaxed">{documentError}</div>
      ) : null}

      {isDocumentsLoading ? (
        <Shimmer className="text-sm">Loading documents...</Shimmer>
      ) : documents.length === 0 ? (
        <div className="border border-dashed border-foreground/10 px-3 py-4 text-muted-foreground text-xs/relaxed">
          Create a scratch doc to exercise the versioned document route and the
          artifact dialog.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <button
              className="w-full border border-foreground/10 px-3 py-2 text-left transition-colors hover:border-foreground/30"
              key={document.id}
              onClick={() => onOpen(document.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileTextIcon className="size-3.5 text-muted-foreground" />
                  <span className="truncate text-sm">{document.title}</span>
                </div>
                {selectedDocumentId === document.id ? (
                  <Badge variant="secondary">Open</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {formatUltraChatbotAgentDocumentTimestamp(document.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
