import type { ObjectGenerationResult } from "./schema";

export const objectGenerationRecordIdHeader = "x-object-generation-record-id";

export interface ObjectGenerationUsageRecord {
  cachedInputTokens: number | undefined;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  reasoningTokens: number | undefined;
  totalTokens: number | undefined;
}

export interface ObjectGenerationRecord {
  errorMessage: string | null;
  id: string;
  recordedAt: string | null;
  result: ObjectGenerationResult | null;
  status: "pending" | "ready" | "error";
  usage: ObjectGenerationUsageRecord | null;
}
