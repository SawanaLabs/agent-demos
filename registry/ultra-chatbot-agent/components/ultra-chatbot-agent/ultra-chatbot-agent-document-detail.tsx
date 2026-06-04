"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { UltraChatbotAgentDocumentRecord } from "@/lib/ultra-chatbot-agent/server/document-store";
import type { UltraChatbotAgentSuggestionRecord } from "@/lib/ultra-chatbot-agent/server/suggestion-store";
import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";
import { UltraChatbotAgentDiffView } from "./ultra-chatbot-agent-diff-view";
import {
  formatUltraChatbotAgentDocumentTimestamp,
  loadUltraChatbotAgentDocumentSuggestions,
  loadUltraChatbotAgentDocumentVersions,
  restoreUltraChatbotAgentDocumentVersion,
  saveUltraChatbotAgentDocumentDraft,
} from "./ultra-chatbot-agent-document-client";
import { UltraChatbotAgentDocumentSuggestions } from "./ultra-chatbot-agent-document-suggestions";
import { UltraChatbotAgentMessageResponse } from "./ultra-chatbot-agent-message-response";
import { UltraChatbotAgentVersionFooter } from "./ultra-chatbot-agent-version-footer";

type UltraChatbotAgentCodeLanguage = ComponentProps<
  typeof CodeBlock
>["language"];

function UltraChatbotAgentCodeDocumentPreview({
  content,
  onStartEdit,
  title,
}: {
  content: string;
  onStartEdit: () => void;
  title: string;
}) {
  const language = inferCodeLanguage(title, content);

  return (
    <CodeBlock
      className="min-h-[24rem] rounded-xl border-foreground/10 [&_pre]:min-h-[20rem]"
      code={content}
      language={language}
      onDoubleClick={onStartEdit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onStartEdit();
        }
      }}
      role="button"
      showLineNumbers
      tabIndex={0}
    >
      <CodeBlockHeader className="gap-3">
        <CodeBlockTitle className="min-w-0">
          <CodeBlockFilename className="truncate">{title}</CodeBlockFilename>
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton />
        </CodeBlockActions>
      </CodeBlockHeader>
    </CodeBlock>
  );
}

function inferCodeLanguage(
  title: string,
  content: string
): UltraChatbotAgentCodeLanguage {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.endsWith(".tsx")) {
    return "tsx";
  }

  if (lowerTitle.endsWith(".ts")) {
    return "typescript";
  }

  if (lowerTitle.endsWith(".jsx")) {
    return "jsx";
  }

  if (lowerTitle.endsWith(".js")) {
    return "javascript";
  }

  if (lowerTitle.endsWith(".py")) {
    return "python";
  }

  if (lowerTitle.endsWith(".json")) {
    return "json";
  }

  if (lowerTitle.endsWith(".css")) {
    return "css";
  }

  if (lowerTitle.endsWith(".html")) {
    return "html";
  }

  if (lowerTitle.endsWith(".md") || lowerTitle.endsWith(".mdx")) {
    return "markdown";
  }

  const trimmedContent = content.trim();

  if (trimmedContent.startsWith("{") || trimmedContent.startsWith("[")) {
    return "json";
  }

  return "typescript";
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: document detail coordinates artifact loading, preview, editing, diffing, and version controls for one focused dialog.
// biome-ignore lint/complexity/noExcessiveLinesPerFunction: splitting this while the artifact contract is still moving would add indirection without reducing the bug surface.
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
    if (refreshToken < 0) {
      return;
    }

    refreshSelectedDocument().catch(() => undefined);
    refreshSelectedSuggestions().catch(() => undefined);
    setIsEditing(false);
    setSelectedVersionIndex(0);
    onModeChange("edit");
  }, [
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
    return (
      <div className="text-destructive text-xs/relaxed">{detailError}</div>
    );
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
      <div className="border border-foreground/10 border-dashed px-3 py-4 text-muted-foreground text-xs/relaxed">
        This document is no longer available.
      </div>
    );
  }

  let documentBody: ReactNode;

  if (mode === "diff") {
    documentBody = (
      <UltraChatbotAgentDiffView
        after={selectedDocument.content ?? ""}
        before={comparisonDocument?.content ?? ""}
      />
    );
  } else if (isLatestVersion && isEditing) {
    documentBody = (
      <Textarea
        className="min-h-[24rem]"
        onChange={(event) => setDraftContent(event.target.value)}
        value={draftContent}
      />
    );
  } else if (selectedDocument.kind === "code") {
    documentBody = (
      <UltraChatbotAgentCodeDocumentPreview
        content={previewContent}
        onStartEdit={() => {
          if (isLatestVersion) {
            setIsEditing(true);
          }
        }}
        title={selectedDocument.title}
      />
    );
  } else {
    documentBody = (
      // biome-ignore lint/a11y/useSemanticElements: the rich markdown preview may contain nested interactive content, so it cannot be wrapped in a semantic button.
      <div
        className="min-h-[24rem] rounded-xl border border-foreground/10 px-4 py-4 text-sm"
        onDoubleClick={() => {
          if (isLatestVersion) {
            setIsEditing(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && isLatestVersion) {
            setIsEditing(true);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <UltraChatbotAgentMessageResponse>
          {previewContent}
        </UltraChatbotAgentMessageResponse>
      </div>
    );
  }

  let versionHelpText =
    "History view is read-only until you restore or jump to latest.";

  if (mode === "diff") {
    versionHelpText =
      "Diff view compares the selected version against its nearest neighbor.";
  } else if (isLatestVersion && isEditing) {
    versionHelpText = "Editing the latest artifact revision.";
  } else if (isLatestVersion) {
    versionHelpText =
      "Preview mode renders markdown. Use Edit or double-click the body to revise.";
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 border-foreground/10 border-b pb-4">
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

      {documentBody}

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Version{" "}
          {formatUltraChatbotAgentDocumentTimestamp(selectedDocument.createdAt)}
        </p>
        <p className="text-muted-foreground text-xs">{versionHelpText}</p>
      </div>

      <UltraChatbotAgentVersionFooter
        currentVersionIndex={selectedVersionIndex}
        isEditing={isEditing}
        isLatestVersionView={isLatestVersion}
        mode={mode}
        onCancelEdit={handleCancelEdit}
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
        onRestoreVersion={handleRestoreVersion}
        onSaveVersion={handleSaveVersion}
        onSetMode={onModeChange}
        onStartEdit={handleStartEdit}
        saveDisabled={disabled || isSaving || !isLatestVersion}
        totalVersions={selectedDocumentVersions.length}
      />

      <div className="space-y-2 border-foreground/10 border-t pt-4">
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
