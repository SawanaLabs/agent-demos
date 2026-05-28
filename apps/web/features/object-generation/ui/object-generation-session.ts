import type { DeepPartial } from "ai";

import {
  type ObjectGenerationRecord,
  objectGenerationRecordIdHeader,
} from "../record";
import type {
  ObjectGenerationAttachment,
  ObjectGenerationResult,
} from "../schema";
import type {
  PendingReviewAttachment,
  SubmittedReviewAttachment,
} from "./convert-files-to-object-generation-inputs";

export type ReviewEntryStatus = "streaming" | "ready" | "error" | "stopped";

export interface ReviewThreadEntry {
  attachments: SubmittedReviewAttachment[];
  errorMessage: string | null;
  id: string;
  prompt: string;
  record: ObjectGenerationRecord | null;
  requestAttachments: ObjectGenerationAttachment[];
  result: DeepPartial<ObjectGenerationResult> | undefined;
  status: ReviewEntryStatus;
}

export interface DisplayReviewThreadEntry extends ReviewThreadEntry {
  isActive: boolean;
  liveResult: DeepPartial<ObjectGenerationResult> | undefined;
  liveStatus: ReviewEntryStatus;
}

interface CreateReviewThreadEntryInput {
  id: string;
  pendingAttachments: PendingReviewAttachment[];
  prompt: string;
  requestAttachments: ObjectGenerationAttachment[];
}

interface FinalizeReviewThreadEntryInput {
  entryId: string;
  errorMessage?: string | null;
  record: ObjectGenerationRecord | null;
  result: DeepPartial<ObjectGenerationResult> | undefined;
  status: ReviewEntryStatus;
}

export function buildPendingRecord(recordId: string): ObjectGenerationRecord {
  return {
    errorMessage: null,
    id: recordId,
    recordedAt: null,
    result: null,
    status: "pending",
    usage: null,
  };
}

export function createReviewThreadEntry({
  id,
  pendingAttachments,
  prompt,
  requestAttachments,
}: CreateReviewThreadEntryInput): ReviewThreadEntry {
  return {
    attachments: toSubmittedReviewAttachments(pendingAttachments),
    errorMessage: null,
    id,
    prompt,
    record: null,
    requestAttachments,
    result: undefined,
    status: "streaming",
  };
}

export function mergePendingReviewAttachments(
  current: PendingReviewAttachment[],
  nextAttachments: PendingReviewAttachment[]
) {
  const byId = new Map(
    current.map((attachment) => [attachment.id, attachment])
  );

  for (const attachment of nextAttachments) {
    byId.set(attachment.id, attachment);
  }

  return Array.from(byId.values());
}

export function removePendingReviewAttachment(
  current: PendingReviewAttachment[],
  attachmentId: string
) {
  const removedAttachment =
    current.find((attachment) => attachment.id === attachmentId) ?? null;

  return {
    nextAttachments: current.filter(
      (attachment) => attachment.id !== attachmentId
    ),
    removedAttachment,
  };
}

export function collectReviewPreviewUrls(
  pendingAttachments: PendingReviewAttachment[],
  entries: ReviewThreadEntry[]
) {
  const previewUrls = new Set<string>();

  for (const attachment of pendingAttachments) {
    previewUrls.add(attachment.previewUrl);
  }

  for (const entry of entries) {
    for (const attachment of entry.attachments) {
      previewUrls.add(attachment.previewUrl);
    }
  }

  return previewUrls;
}

export function attachRecordIdToEntry(
  entries: ReviewThreadEntry[],
  entryId: string,
  recordId: string
) {
  return entries.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          record: buildPendingRecord(recordId),
        }
      : entry
  );
}

export function finalizeReviewThreadEntry(
  entries: ReviewThreadEntry[],
  {
    entryId,
    errorMessage = null,
    record,
    result,
    status,
  }: FinalizeReviewThreadEntryInput
) {
  return entries.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          errorMessage,
          record,
          result,
          status,
        }
      : entry
  );
}

export function failReviewThreadEntry(
  entries: ReviewThreadEntry[],
  entryId: string,
  errorMessage: string,
  result: DeepPartial<ObjectGenerationResult> | undefined
) {
  return finalizeReviewThreadEntry(entries, {
    entryId,
    errorMessage,
    record: entries.find((entry) => entry.id === entryId)?.record ?? null,
    result,
    status: "error",
  });
}

export function stopReviewThreadEntry(
  entries: ReviewThreadEntry[],
  entryId: string,
  result: DeepPartial<ObjectGenerationResult> | undefined
) {
  return finalizeReviewThreadEntry(entries, {
    entryId,
    record: entries.find((entry) => entry.id === entryId)?.record ?? null,
    result,
    status: "stopped",
  });
}

export function restartReviewThreadEntry(
  entries: ReviewThreadEntry[],
  entryId: string
): ReviewThreadEntry[] {
  return entries.map(
    (entry): ReviewThreadEntry =>
      entry.id === entryId
        ? {
            ...entry,
            errorMessage: null,
            record: null,
            status: "streaming" as const,
          }
        : entry
  );
}

export function toDisplayReviewThreadEntries(
  entries: ReviewThreadEntry[],
  activeEntryId: string | null,
  isLoading: boolean,
  liveObject: DeepPartial<ObjectGenerationResult> | undefined
): DisplayReviewThreadEntry[] {
  return entries.map((entry) => {
    const isActive = activeEntryId === entry.id;

    return {
      ...entry,
      isActive,
      liveResult: isActive ? (liveObject ?? entry.result) : entry.result,
      liveStatus: isActive && isLoading ? "streaming" : entry.status,
    };
  });
}

export function toSubmittedReviewAttachments(
  attachments: PendingReviewAttachment[]
): SubmittedReviewAttachment[] {
  return attachments.map((attachment) => ({
    filename: attachment.file.name,
    id: attachment.id,
    mediaType: attachment.file.type || "application/octet-stream",
    previewUrl: attachment.previewUrl,
  }));
}

export function readRecordIdFromResponse(response: Response) {
  return response.headers.get(objectGenerationRecordIdHeader);
}
