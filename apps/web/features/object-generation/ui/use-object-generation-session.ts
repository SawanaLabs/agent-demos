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

export function useObjectGenerationSession(): ObjectGenerationSessionController {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingReviewAttachment[]
  >([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReviewThreadEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [inputResetKey, setInputResetKey] = useState(0);
  const pendingAttachmentsRef = useRef<PendingReviewAttachment[]>([]);
  const entriesRef = useRef<ReviewThreadEntry[]>([]);
  const latestObjectRef = useRef<
    DeepPartial<ObjectGenerationResult> | undefined
  >(undefined);
  const activeEntryIdRef = useRef<string | null>(null);

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
      const entryId = activeEntryIdRef.current;

      if (!entryId) {
        return;
      }

      setEntries((current) =>
        failReviewThreadEntry(
          current,
          entryId,
          streamError.message,
          latestObjectRef.current
        )
      );
      setActiveEntryId(null);
    },
    async onFinish({ error: finishError, object: finalObject }) {
      const entryId = activeEntryIdRef.current;

      if (!entryId) {
        return;
      }

      const currentEntry = entriesRef.current.find(
        (entry) => entry.id === entryId
      );
      const result =
        finalObject ?? latestObjectRef.current ?? currentEntry?.result;

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

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    activeEntryIdRef.current = activeEntryId;
  }, [activeEntryId]);

  useEffect(() => {
    latestObjectRef.current = object;
  }, [object]);

  useEffect(
    () => () => {
      for (const url of collectReviewPreviewUrls(
        pendingAttachmentsRef.current,
        entriesRef.current
      )) {
        URL.revokeObjectURL(url);
      }
    },
    []
  );

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
      latestObjectRef.current = undefined;
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
    const entryId = activeEntryIdRef.current;

    stop();

    if (!entryId) {
      return;
    }

    setEntries((current) =>
      stopReviewThreadEntry(current, entryId, latestObjectRef.current)
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
    latestObjectRef.current = undefined;
    submit({
      attachments: entry.requestAttachments,
      prompt: entry.prompt,
    });
  }

  return {
    composerError,
    entries: useMemo(
      () =>
        toDisplayReviewThreadEntries(entries, activeEntryId, isLoading, object),
      [entries, activeEntryId, isLoading, object]
    ),
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
