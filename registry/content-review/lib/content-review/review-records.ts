import type { LanguageModelUsage } from "ai";

import type {
  ContentReviewRecord,
  ContentReviewUsageRecord,
} from "@/lib/content-review/record";
import { contentReviewResultSchema } from "@/lib/content-review/schema";

const invalidRecordIdError = 'Expected a "recordId" query parameter.';

const contentReviewRecords = new Map<string, ContentReviewRecord>();

function buildUsageRecord(
  usage: LanguageModelUsage
): ContentReviewUsageRecord {
  return {
    cachedInputTokens: usage.cachedInputTokens,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    reasoningTokens:
      usage.outputTokenDetails?.reasoningTokens ?? usage.reasoningTokens,
    totalTokens: usage.totalTokens,
  };
}

export function createPendingContentReviewRecord(recordId: string) {
  contentReviewRecords.set(recordId, {
    errorMessage: null,
    id: recordId,
    recordedAt: null,
    result: null,
    status: "pending",
    usage: null,
  });
}

export function completeContentReviewRecord(
  recordId: string,
  result: unknown,
  usage: LanguageModelUsage
) {
  const parsed = contentReviewResultSchema.safeParse(result);

  if (!parsed.success) {
    failContentReviewRecord(recordId, parsed.error.message);
    return;
  }

  contentReviewRecords.set(recordId, {
    errorMessage: null,
    id: recordId,
    recordedAt: new Date().toISOString(),
    result: parsed.data,
    status: "ready",
    usage: buildUsageRecord(usage),
  });
}

export function failContentReviewRecord(recordId: string, message: string) {
  const previous = contentReviewRecords.get(recordId);

  contentReviewRecords.set(recordId, {
    errorMessage: message,
    id: recordId,
    recordedAt: new Date().toISOString(),
    result: previous?.result ?? null,
    status: "error",
    usage: previous?.usage ?? null,
  });
}

export function getContentReviewRecord(recordId: string) {
  return contentReviewRecords.get(recordId) ?? null;
}

export function clearContentReviewRecordsForTest() {
  contentReviewRecords.clear();
}

export async function handleContentReviewRecordRequest(request: Request) {
  const recordId = new URL(request.url).searchParams.get("recordId");

  if (!recordId) {
    return Response.json(
      {
        error: invalidRecordIdError,
      },
      { status: 400 }
    );
  }

  const record = getContentReviewRecord(recordId);

  if (!record) {
    return Response.json(
      {
        error: `No content-review record found for ${recordId}.`,
      },
      { status: 404 }
    );
  }

  return Response.json(record);
}
