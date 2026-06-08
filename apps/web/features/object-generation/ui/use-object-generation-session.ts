"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { DeepPartial } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ObjectGenerationAttachment,
  ObjectGenerationResult,
} from "../schema";
import { objectGenerationResultSchema } from "../schema";
import {
  buildPendingReviewAttachment,
  convertFilesToReviewAttachments,
  type PendingReviewAttachment,
} from "./convert-files-to-object-generation-inputs";
import {
  collectReviewPreviewUrls,
  createReviewThreadEntry,
  type DisplayReviewThreadEntry,
  failReviewThreadEntry,
  mergePendingReviewAttachments,
  type ReviewThreadEntry,
  restartReviewThreadEntry,
  stopReviewThreadEntry,
  toDisplayReviewThreadEntries,
} from "./object-generation-session";

export interface ObjectGenerationSessionController {
  appendFiles: (fileList: FileList | null) => void;
  composerError: string | null;
  entries: DisplayReviewThreadEntry[];
  hasMessages: boolean;
  inputResetKey: number;
  isLoading: boolean;
  pendingAttachments: PendingReviewAttachment[];
  removePendingAttachment: (attachmentId: string) => void;
  retryReview: (entry: ReviewThreadEntry) => void;
  stopReview: () => void;
  streamErrorMessage: string | null;
  submitReview: (text: string) => Promise<void>;
}

function useObjectGenerationSessionRefs() {
  return {
    activeEntryIdRef: useRef<string | null>(null),
    entriesRef: useRef<ReviewThreadEntry[]>([]),
    latestObjectRef: useRef<DeepPartial<ObjectGenerationResult> | undefined>(
      undefined
    ),
    pendingAttachmentsRef: useRef<PendingReviewAttachment[]>([]),
  };
}

function useSyncObjectGenerationSessionRefs(
  refs: ReturnType<typeof useObjectGenerationSessionRefs>,
  input: {
    activeEntryId: string | null;
    entries: ReviewThreadEntry[];
    object: DeepPartial<ObjectGenerationResult> | undefined;
    pendingAttachments: PendingReviewAttachment[];
  }
) {
  useEffect(() => {
    refs.pendingAttachmentsRef.current = input.pendingAttachments;
  }, [input.pendingAttachments, refs.pendingAttachmentsRef]);

  useEffect(() => {
    refs.entriesRef.current = input.entries;
  }, [input.entries, refs.entriesRef]);

  useEffect(() => {
    refs.activeEntryIdRef.current = input.activeEntryId;
  }, [input.activeEntryId, refs.activeEntryIdRef]);

  useEffect(() => {
    refs.latestObjectRef.current = input.object;
  }, [input.object, refs.latestObjectRef]);

  useEffect(
    () => () => {
      for (const url of collectReviewPreviewUrls(
        refs.pendingAttachmentsRef.current,
        refs.entriesRef.current
      )) {
        URL.revokeObjectURL(url);
      }
    },
    [refs.entriesRef, refs.pendingAttachmentsRef]
  );
}

function useDisplayReviewThreadEntries(input: {
  activeEntryId: string | null;
  entries: ReviewThreadEntry[];
  isLoading: boolean;
  object: DeepPartial<ObjectGenerationResult> | undefined;
}) {
  return useMemo(
    () =>
      toDisplayReviewThreadEntries(
        input.entries,
        input.activeEntryId,
        input.isLoading,
        input.object
      ),
    [input.entries, input.activeEntryId, input.isLoading, input.object]
  );
}

export function useObjectGenerationSession(): ObjectGenerationSessionController {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingReviewAttachment[]
  >([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReviewThreadEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [inputResetKey, setInputResetKey] = useState(0);
  const refs = useObjectGenerationSessionRefs();

  const { clear, error, isLoading, object, stop, submit } = useObject<
    typeof objectGenerationResultSchema,
    ObjectGenerationResult,
    {
      attachments: ObjectGenerationAttachment[];
      prompt: string;
    }
  >({
    api: "/api/demos/object-generation",
    onError(streamError) {
      const entryId = refs.activeEntryIdRef.current;

      if (!entryId) {
        return;
      }

      setEntries((current) =>
        failReviewThreadEntry(
          current,
          entryId,
          streamError.message,
          refs.latestObjectRef.current
        )
      );
      setActiveEntryId(null);
    },
    async onFinish({ error: finishError, object: finalObject }) {
      const entryId = refs.activeEntryIdRef.current;

      if (!entryId) {
        return;
      }

      const currentEntry = refs.entriesRef.current.find(
        (entry) => entry.id === entryId
      );
      const result =
        finalObject ?? refs.latestObjectRef.current ?? currentEntry?.result;

      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                errorMessage: finishError?.message ?? null,
                result,
                status: finishError ? "error" : "ready",
              }
            : entry
        )
      );
      setActiveEntryId(null);
    },
    schema: objectGenerationResultSchema,
  });

  useSyncObjectGenerationSessionRefs(refs, {
    activeEntryId,
    entries,
    object,
    pendingAttachments,
  });

  const displayEntries = useDisplayReviewThreadEntries({
    activeEntryId,
    entries,
    isLoading,
    object,
  });

  function removePendingAttachment(attachmentId: string) {
    setPendingAttachments((current) => {
      const target =
        current.find((attachment) => attachment.id === attachmentId) ?? null;

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  }

  function appendFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextAttachments = Array.from(fileList).map(
      buildPendingReviewAttachment
    );
    setPendingAttachments((current) =>
      mergePendingReviewAttachments(current, nextAttachments)
    );
  }

  async function submitReview(text: string) {
    const prompt = text.trim();

    if (!prompt && pendingAttachments.length === 0) {
      return;
    }

    try {
      setComposerError(null);
      const requestAttachments = await convertFilesToReviewAttachments(
        pendingAttachments.map((attachment) => attachment.file)
      );
      const entryId = crypto.randomUUID();

      setEntries((current) => [
        ...current,
        createReviewThreadEntry({
          id: entryId,
          pendingAttachments,
          prompt,
          requestAttachments,
        }),
      ]);
      setActiveEntryId(entryId);
      refs.latestObjectRef.current = undefined;
      submit({
        attachments: requestAttachments,
        prompt,
      });
      setPendingAttachments([]);
      setInputResetKey((current) => current + 1);
    } catch (attachmentError) {
      setComposerError(
        attachmentError instanceof Error
          ? attachmentError.message
          : "Failed to prepare review attachments."
      );
    }
  }

  function stopReview() {
    const entryId = refs.activeEntryIdRef.current;

    stop();

    if (!entryId) {
      return;
    }

    setEntries((current) =>
      stopReviewThreadEntry(current, entryId, refs.latestObjectRef.current)
    );
    setActiveEntryId(null);
  }

  function retryReview(entry: ReviewThreadEntry) {
    if (isLoading) {
      return;
    }

    clear();
    setEntries((current) => restartReviewThreadEntry(current, entry.id));
    setActiveEntryId(entry.id);
    refs.latestObjectRef.current = undefined;
    submit({
      attachments: entry.requestAttachments,
      prompt: entry.prompt,
    });
  }

  return {
    composerError,
    entries: displayEntries,
    hasMessages: entries.length > 0,
    inputResetKey,
    isLoading,
    pendingAttachments,
    streamErrorMessage: error?.message ?? null,
    appendFiles,
    removePendingAttachment,
    retryReview,
    stopReview,
    submitReview,
  };
}
