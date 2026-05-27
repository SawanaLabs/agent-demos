import type { LanguageModelUsage } from "ai";

import type {
  ObjectGenerationRecord,
  ObjectGenerationUsageRecord,
} from "../record";
import { objectGenerationResultSchema } from "../schema";

const invalidRecordIdError = 'Expected a "recordId" query parameter.';

const objectGenerationRecords = new Map<string, ObjectGenerationRecord>();

function buildUsageRecord(
  usage: LanguageModelUsage
): ObjectGenerationUsageRecord {
  return {
    cachedInputTokens: usage.cachedInputTokens,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    reasoningTokens:
      usage.outputTokenDetails?.reasoningTokens ?? usage.reasoningTokens,
    totalTokens: usage.totalTokens,
  };
}

export function createPendingObjectGenerationRecord(recordId: string) {
  objectGenerationRecords.set(recordId, {
    errorMessage: null,
    id: recordId,
    recordedAt: null,
    result: null,
    status: "pending",
    usage: null,
  });
}

export function completeObjectGenerationRecord(
  recordId: string,
  result: unknown,
  usage: LanguageModelUsage
) {
  const parsed = objectGenerationResultSchema.safeParse(result);

  if (!parsed.success) {
    failObjectGenerationRecord(recordId, parsed.error.message);
    return;
  }

  objectGenerationRecords.set(recordId, {
    errorMessage: null,
    id: recordId,
    recordedAt: new Date().toISOString(),
    result: parsed.data,
    status: "ready",
    usage: buildUsageRecord(usage),
  });
}

export function failObjectGenerationRecord(recordId: string, message: string) {
  const previous = objectGenerationRecords.get(recordId);

  objectGenerationRecords.set(recordId, {
    errorMessage: message,
    id: recordId,
    recordedAt: new Date().toISOString(),
    result: previous?.result ?? null,
    status: "error",
    usage: previous?.usage ?? null,
  });
}

export function getObjectGenerationRecord(recordId: string) {
  return objectGenerationRecords.get(recordId) ?? null;
}

export function clearObjectGenerationRecordsForTest() {
  objectGenerationRecords.clear();
}

export async function handleObjectGenerationRecordRequest(request: Request) {
  const recordId = new URL(request.url).searchParams.get("recordId");

  if (!recordId) {
    return Response.json(
      {
        error: invalidRecordIdError,
      },
      { status: 400 }
    );
  }

  const record = getObjectGenerationRecord(recordId);

  if (!record) {
    return Response.json(
      {
        error: `No object-generation record found for ${recordId}.`,
      },
      { status: 404 }
    );
  }

  return Response.json(record);
}
