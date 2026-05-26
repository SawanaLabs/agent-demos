"use client";

import { MessageResponse } from "@workspace/ui/components/ai-elements/message";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import { Badge } from "@workspace/ui/components/badge";
import { Textarea } from "@workspace/ui/components/textarea";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { UltraChatbotAgentDocumentRecord } from "../server/document-store";
import type { UltraChatbotAgentSuggestionRecord } from "../server/suggestion-store";
import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";
import {
  formatUltraChatbotAgentDocumentTimestamp,
  loadUltraChatbotAgentDocumentSuggestions,
  loadUltraChatbotAgentDocumentVersions,
  restoreUltraChatbotAgentDocumentVersion,
  saveUltraChatbotAgentDocumentDraft,
} from "./ultra-chatbot-agent-document-client";
import { UltraChatbotAgentDiffView } from "./ultra-chatbot-agent-diff-view";
import { UltraChatbotAgentDocumentSuggestions } from "./ultra-chatbot-agent-document-suggestions";
import { UltraChatbotAgentVersionFooter } from "./ultra-chatbot-agent-version-footer";

export function UltraChatbotAgentDocumentDetail({
  chatId,
  disabled,
  documentId,
  mode,
  onModeChange,
  onRefreshArtifact,
  refreshToken,
}: {
  chatId: string;
  disabled: boolean;
  documentId: string;
  mode: UltraChatbotAgentArtifactMode;
  onModeChange: (mode: UltraChatbotAgentArtifactMode) => void;
  onRefreshArtifact: () => void;
  refreshToken: number;
}) {
  const [detailError, setDetailError] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isVersionsLoading, setIsVersionsLoading] = useState(true);
  const [selectedDocumentVersions, setSelectedDocumentVersions] = useState<
    UltraChatbotAgentDocumentRecord[]
  >([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<
    UltraChatbotAgentSuggestionRecord[]
  >([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const refreshSelectedDocument = useCallback(async () => {
    setIsVersionsLoading(true);

    try {
      const versions = await loadUltraChatbotAgentDocumentVersions(
        chatId,
        documentId
      );
      setSelectedDocumentVersions(versions);
      setDraftContent(versions[0]?.content ?? "");
      setDetailError(null);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Failed to load document versions."
      );
    } finally {
      setIsVersionsLoading(false);
    }
  }, [chatId, documentId]);

  const refreshSelectedSuggestions = useCallback(async () => {
    setIsSuggestionsLoading(true);

    try {
      const suggestions = await loadUltraChatbotAgentDocumentSuggestions(
        chatId,
        documentId
      );
      setSelectedSuggestions(suggestions);
      setDetailError(null);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Failed to load document suggestions."
      );
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [chatId, documentId]);

  useEffect(() => {
    void refreshSelectedDocument();
    void refreshSelectedSuggestions();
    setIsEditing(false);
    setSelectedVersionIndex(0);
    onModeChange("edit");
  }, [
    documentId,
    onModeChange,
    refreshSelectedDocument,
    refreshSelectedSuggestions,
    refreshToken,
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
  const previewContent = isLatestVersion
    ? draftContent
    : (selectedDocument?.content ?? "");

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

  async function handleSaveVersion() {
    if (!selectedLatestDocument) {
      return;
    }

    setIsSaving(true);

    try {
      await saveUltraChatbotAgentDocumentDraft({
        chatId,
        content: draftContent,
        documentId: selectedLatestDocument.id,
        title: selectedLatestDocument.title,
      });
      setDetailError(null);
      setIsEditing(false);
      onRefreshArtifact();
      setSelectedVersionIndex(0);
      onModeChange("edit");
    } catch (error) {
      setDetailError(
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

    try {
      await restoreUltraChatbotAgentDocumentVersion({
        chatId,
        createdAt: selectedDocument.createdAt,
        documentId: selectedDocument.id,
      });
      setDetailError(null);
      setIsEditing(false);
      onRefreshArtifact();
      setSelectedVersionIndex(0);
      onModeChange("edit");
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Failed to restore the selected document version."
      );
    }
  }

  function handleStartEdit() {
    if (!isLatestVersion || mode === "diff") {
      return;
    }

    setIsEditing(true);
  }

  function handleCancelEdit() {
    setDraftContent(selectedLatestDocument?.content ?? "");
    setIsEditing(false);
  }

  if (detailError) {
    return <div className="text-destructive text-xs/relaxed">{detailError}</div>;
  }

  if (isVersionsLoading) {
    return (
      <div className="space-y-4">
        <Shimmer className="text-sm">Loading document...</Shimmer>
        <div className="space-y-3">
          <div className="h-6 w-48 rounded-md bg-muted/50" />
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-20 rounded-md bg-muted/50" />
            <div className="h-7 w-28 rounded-md bg-muted/50" />
            <div className="h-7 w-16 rounded-md bg-muted/50" />
          </div>
        </div>
        <div className="space-y-2 rounded-xl border border-foreground/10 bg-muted/20 px-4 py-4">
          <div className="h-4 w-5/6 rounded-md bg-muted/50" />
          <div className="h-4 w-full rounded-md bg-muted/50" />
          <div className="h-4 w-4/5 rounded-md bg-muted/50" />
          <div className="h-4 w-3/4 rounded-md bg-muted/50" />
          <div className="h-4 w-[88%] rounded-md bg-muted/50" />
          <div className="h-4 w-2/3 rounded-md bg-muted/50" />
          <div className="h-4 w-[92%] rounded-md bg-muted/50" />
          <div className="h-4 w-3/5 rounded-md bg-muted/50" />
        </div>
      </div>
    );
  }

  if (!selectedDocument) {
    return (
      <div className="border border-dashed border-foreground/10 px-3 py-4 text-muted-foreground text-xs/relaxed">
        This document is no longer available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 border-b border-foreground/10 pb-4">
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
        <p className="max-w-2xl text-muted-foreground text-xs/relaxed">
          Review, revise, diff, and restore this artifact without leaving the
          current chat route.
        </p>
      </div>

      {mode === "diff" ? (
        <UltraChatbotAgentDiffView
          after={selectedDocument.content ?? ""}
          before={comparisonDocument?.content ?? ""}
        />
      ) : isLatestVersion && isEditing ? (
        <Textarea
          className="min-h-[24rem]"
          onChange={(event) => setDraftContent(event.target.value)}
          value={draftContent}
        />
      ) : (
        <div
          className="min-h-[24rem] rounded-xl border border-foreground/10 px-4 py-4 text-sm"
          onDoubleClick={() => {
            if (isLatestVersion) {
              setIsEditing(true);
            }
          }}
        >
          <MessageResponse>{previewContent}</MessageResponse>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Version {formatUltraChatbotAgentDocumentTimestamp(selectedDocument.createdAt)}
        </p>
        <p className="text-muted-foreground text-xs">
          {mode === "diff"
            ? "Diff view compares the selected version against its nearest neighbor."
            : isLatestVersion && isEditing
              ? "Editing the latest artifact revision."
              : isLatestVersion
                ? "Preview mode renders markdown. Use Edit or double-click the body to revise."
                : "History view is read-only until you restore or jump to latest."}
        </p>
      </div>

      <UltraChatbotAgentVersionFooter
        currentVersionIndex={selectedVersionIndex}
        isEditing={isEditing}
        isLatestVersionView={isLatestVersion}
        mode={mode}
        onChangeVersion={(direction) => {
          if (direction === "latest") {
            setIsEditing(false);
            setSelectedVersionIndex(0);
            onModeChange("edit");
            return;
          }

          if (direction === "newer") {
            setIsEditing(false);
            setSelectedVersionIndex((current) => Math.max(0, current - 1));
            return;
          }

          setIsEditing(false);
          setSelectedVersionIndex((current) =>
            Math.min(selectedDocumentVersions.length - 1, current + 1)
          );
        }}
        onCancelEdit={handleCancelEdit}
        onRestoreVersion={handleRestoreVersion}
        onSaveVersion={handleSaveVersion}
        onSetMode={onModeChange}
        onStartEdit={handleStartEdit}
        saveDisabled={disabled || isSaving || !isLatestVersion}
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
    </div>
  );
}
