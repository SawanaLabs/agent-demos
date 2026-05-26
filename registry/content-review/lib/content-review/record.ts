import type { ContentReviewResult } from "@/lib/content-review/schema";

export const contentReviewRecordIdHeader = "x-content-review-record-id";

export interface ContentReviewUsageRecord {
  cachedInputTokens: number | undefined;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  reasoningTokens: number | undefined;
  totalTokens: number | undefined;
}

export interface ContentReviewRecord {
  errorMessage: string | null;
  id: string;
  recordedAt: string | null;
  result: ContentReviewResult | null;
  status: "pending" | "ready" | "error";
  usage: ContentReviewUsageRecord | null;
}
