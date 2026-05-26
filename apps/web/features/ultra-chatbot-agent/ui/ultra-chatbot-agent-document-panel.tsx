"use client";

import { FileTextIcon, PlusIcon } from "@phosphor-icons/react";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { UltraChatbotAgentDocumentRecord } from "../server/document-store";
import type { UltraChatbotAgentSuggestionRecord } from "../server/suggestion-store";
import { UltraChatbotAgentArtifactActions } from "./ultra-chatbot-agent-artifact-actions";
import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";
import { UltraChatbotAgentDiffView } from "./ultra-chatbot-agent-diff-view";
import { UltraChatbotAgentDocumentSuggestions } from "./ultra-chatbot-agent-document-suggestions";
import { UltraChatbotAgentVersionFooter } from "./ultra-chatbot-agent-version-footer";

function formatDocumentTimestamp(value: string) {
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

async function loadUltraChatbotAgentDocuments() {
  const response = await fetch("/api/demos/ultra-chatbot-agent/document", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load visitor documents.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord[];
}

async function loadUltraChatbotAgentDocumentVersions(documentId: string) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?id=${documentId}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load document versions.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord[];
}

async function loadUltraChatbotAgentDocumentSuggestions(documentId: string) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/suggestions?id=${documentId}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load document suggestions.");
  }

  return (await response.json()) as UltraChatbotAgentSuggestionRecord[];
}

async function createUltraChatbotAgentScratchDocument() {
  const documentId = crypto.randomUUID();
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?id=${documentId}`,
    {
      body: JSON.stringify({
        content: "",
        kind: "text",
        title: "Scratch note",
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create the scratch document.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord;
}

async function saveUltraChatbotAgentScratchDocument(input: {
  content: string;
  documentId: string;
  title: string;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/document?id=${input.documentId}`,
    {
      body: JSON.stringify({
        content: input.content,
        isManualEdit: true,
        kind: "text",
        title: input.title,
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save the document draft.");
  }

  return (await response.json()) as UltraChatbotAgentDocumentRecord;
}

export function UltraChatbotAgentDocumentPanel({
  disabled,
  mode,
  onModeChange,
  selectedDocumentId,
  onSelectedDocumentIdChange,
  refreshToken,
}: {
  disabled: boolean;
  mode: UltraChatbotAgentArtifactMode;
  onModeChange: (mode: UltraChatbotAgentArtifactMode) => void;
  onSelectedDocumentIdChange: (documentId: string | null) => void;
  refreshToken: number;
  selectedDocumentId: string | null;
}) {
  const [documents, setDocuments] = useState<UltraChatbotAgentDocumentRecord[]>(
    []
  );
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [selectedDocumentVersions, setSelectedDocumentVersions] = useState<
    UltraChatbotAgentDocumentRecord[]
  >([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<
    UltraChatbotAgentSuggestionRecord[]
  >([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const refreshDocuments = useCallback(async () => {
    setIsDocumentsLoading(true);

    try {
      const nextDocuments = await loadUltraChatbotAgentDocuments();
      setDocuments(nextDocuments);
      onSelectedDocumentIdChange(selectedDocumentId ?? nextDocuments[0]?.id ?? null);
      setDocumentError(null);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Failed to load visitor documents."
      );
    } finally {
      setIsDocumentsLoading(false);
    }
  }, [onSelectedDocumentIdChange, selectedDocumentId]);

  const refreshSelectedDocument = useCallback(async (documentId: string) => {
    setIsVersionsLoading(true);

    try {
      const versions = await loadUltraChatbotAgentDocumentVersions(documentId);
      setSelectedDocumentVersions(versions);
      setDraftContent(versions[0]?.content ?? "");
      setDocumentError(null);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Failed to load document versions."
      );
    } finally {
      setIsVersionsLoading(false);
    }
  }, []);

  const refreshSelectedSuggestions = useCallback(async (documentId: string) => {
    setIsSuggestionsLoading(true);

    try {
      const suggestions = await loadUltraChatbotAgentDocumentSuggestions(documentId);
      setSelectedSuggestions(suggestions);
      setDocumentError(null);
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Failed to load document suggestions."
      );
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  useEffect(() => {
    if (!selectedDocumentId) {
      setSelectedDocumentVersions([]);
      setSelectedSuggestions([]);
      setDraftContent("");
      setSelectedVersionIndex(0);
      return;
    }

    void refreshSelectedDocument(selectedDocumentId);
    void refreshSelectedSuggestions(selectedDocumentId);
    setSelectedVersionIndex(0);
    onModeChange("edit");
  }, [
    onModeChange,
    refreshSelectedDocument,
    refreshSelectedSuggestions,
    refreshToken,
    selectedDocumentId,
  ]);

  const selectedLatestDocument = selectedDocumentVersions[0] ?? null;
  const selectedDocument =
    selectedDocumentVersions[selectedVersionIndex] ?? selectedLatestDocument;
  const comparisonDocument = useMemo(() => {
    if (selectedVersionIndex === 0) {
      return selectedDocumentVersions[1] ?? null;
    }

    return selectedDocumentVersions[selectedVersionIndex - 1] ?? null;
  }, [selectedDocumentVersions, selectedVersionIndex]);
  const isLatestVersion = selectedVersionIndex === 0;

  useEffect(() => {
    if (!selectedDocument) {
      setDraftContent("");
      return;
    }

    if (isLatestVersion) {
      setDraftContent(selectedLatestDocument?.content ?? "");
      return;
    }

    setDraftContent(selectedDocument.content ?? "");
  }, [isLatestVersion, selectedDocument, selectedLatestDocument]);

  async function handleCreateScratchDocument() {
    setIsCreating(true);

    try {
      const document = await createUltraChatbotAgentScratchDocument();
      onSelectedDocumentIdChange(document.id);
      await refreshDocuments();
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

  async function handleSaveVersion() {
    if (!selectedLatestDocument) {
      return;
    }

    setIsSaving(true);

    try {
      await saveUltraChatbotAgentScratchDocument({
        content: draftContent,
        documentId: selectedLatestDocument.id,
        title: selectedLatestDocument.title,
      });
      await refreshDocuments();
      await refreshSelectedDocument(selectedLatestDocument.id);
      await refreshSelectedSuggestions(selectedLatestDocument.id);
      setSelectedVersionIndex(0);
      onModeChange("edit");
    } catch (error) {
      setDocumentError(
        error instanceof Error
          ? error.message
          : "Failed to save the document draft."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRestoreVersion() {
    if (!selectedDocument) {
      return;
    }

    const response = await fetch(
      `/api/demos/ultra-chatbot-agent/document?id=${selectedDocument.id}&timestamp=${encodeURIComponent(selectedDocument.createdAt)}`,
      {
        credentials: "include",
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to restore the selected document version.");
    }

    await refreshDocuments();
    await refreshSelectedDocument(selectedDocument.id);
    await refreshSelectedSuggestions(selectedDocument.id);
    setSelectedVersionIndex(0);
    onModeChange("edit");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Documents
          </p>
          <p className="mt-1 text-sm">
            Versioned text artifacts backed by the Ultra document route.
          </p>
        </div>
        <UltraChatbotAgentArtifactActions
          canResetToLatest={selectedDocumentId != null && !isLatestVersion}
          disabled={disabled}
          hasSelectedDocument={selectedDocumentId != null}
          isCreating={isCreating}
          isLatestVersion={isLatestVersion}
          isSaving={isSaving}
          onCreateScratchDocument={handleCreateScratchDocument}
          onResetToLatest={() => {
            setSelectedVersionIndex(0);
            onModeChange("edit");
          }}
          onSaveVersion={handleSaveVersion}
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
          companion panel.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <button
              className="w-full border border-foreground/10 px-3 py-2 text-left transition-colors hover:border-foreground/30"
              key={document.id}
              onClick={() => onSelectedDocumentIdChange(document.id)}
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
                {formatDocumentTimestamp(document.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedDocumentId ? (
        <div className="space-y-3 border-t border-foreground/10 pt-4">
          {isVersionsLoading ? (
            <Shimmer className="text-sm">Loading document...</Shimmer>
          ) : selectedDocument ? (
            <>
              <div>
                <p className="font-medium text-sm">{selectedDocument.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedDocument.kind}</Badge>
                  <Badge variant="outline">
                    {selectedDocumentVersions.length} versions
                  </Badge>
                  {isLatestVersion ? (
                    <Badge variant="secondary">Latest</Badge>
                  ) : (
                    <Badge variant="outline">History</Badge>
                  )}
                </div>
              </div>

              {mode === "diff" ? (
                <UltraChatbotAgentDiffView
                  after={selectedDocument.content ?? ""}
                  before={comparisonDocument?.content ?? ""}
                />
              ) : isLatestVersion ? (
                <Textarea
                  className="min-h-48"
                  onChange={(event) => setDraftContent(event.target.value)}
                  value={draftContent}
                />
              ) : (
                <div className="min-h-48 whitespace-pre-wrap border border-foreground/10 px-3 py-2 text-sm">
                  {selectedDocument.content ?? ""}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs">
                  Version {formatDocumentTimestamp(selectedDocument.createdAt)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isLatestVersion
                    ? "Editing the latest artifact revision."
                    : "History view is read-only until you restore or jump to latest."}
                </p>
              </div>

              <UltraChatbotAgentVersionFooter
                currentVersionIndex={selectedVersionIndex}
                mode={mode}
                onChangeVersion={(direction) => {
                  if (direction === "latest") {
                    setSelectedVersionIndex(0);
                    onModeChange("edit");
                    return;
                  }

                  if (direction === "newer") {
                    setSelectedVersionIndex((current) => Math.max(0, current - 1));
                    return;
                  }

                  setSelectedVersionIndex((current) =>
                    Math.min(selectedDocumentVersions.length - 1, current + 1)
                  );
                }}
                onRestoreVersion={handleRestoreVersion}
                onSetMode={onModeChange}
                totalVersions={selectedDocumentVersions.length}
              />

              <div className="space-y-2 border-t border-foreground/10 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">Suggestions</p>
                  <Badge variant="outline">{selectedSuggestions.length}</Badge>
                </div>
                {isSuggestionsLoading ? (
                  <Shimmer className="text-sm">Loading suggestions...</Shimmer>
                ) : (
                  <UltraChatbotAgentDocumentSuggestions
                    suggestions={selectedSuggestions}
                  />
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
