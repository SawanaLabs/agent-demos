import { afterEach, describe, expect, it } from "vitest";

import {
  clearContentReviewRecordsForTest,
  getContentReviewRecord,
} from "./review-records";
import { startRecordedReviewRun } from "./recorded-review-run";

describe("recorded review run", () => {
  afterEach(() => {
    clearContentReviewRecordsForTest();
  });

  it("records the final object and token usage after the stream completes", async () => {
    const finalObject = {
      categories: [],
      decision: "approved",
      evidence: [],
      findings: [],
      openQuestions: [],
      recommendedAction: "Publish as-is.",
      riskScore: 4,
      summary: "Safe to publish.",
    };

    const response = startRecordedReviewRun({
      textStream: (async function* () {
        const payload = JSON.stringify(finalObject);
        yield payload.slice(0, 20);
        yield payload.slice(20);
      })(),
      totalUsage: Promise.resolve({
        cachedInputTokens: 3,
        inputTokenDetails: {
          cacheReadTokens: 3,
          cacheWriteTokens: 0,
          noCacheTokens: 12,
        },
        inputTokens: 15,
        outputTokenDetails: {
          reasoningTokens: 2,
          textTokens: 10,
        },
        outputTokens: 12,
        reasoningTokens: 2,
        raw: undefined,
        totalTokens: 27,
      }),
    });

    const recordId = response.headers.get("x-content-review-record-id");

    expect(recordId).toBeTruthy();
    await expect(response.text()).resolves.toEqual(JSON.stringify(finalObject));
    expect(getContentReviewRecord(recordId ?? "")).toMatchObject({
      id: recordId,
      result: finalObject,
      status: "ready",
      usage: {
        cachedInputTokens: 3,
        inputTokens: 15,
        outputTokens: 12,
        reasoningTokens: 2,
        totalTokens: 27,
      },
    });
  });

  it("marks the record as error when the final object cannot be parsed", async () => {
    const response = startRecordedReviewRun({
      textStream: (async function* () {
        yield "{\"decision\":";
      })(),
      totalUsage: Promise.resolve({
        cachedInputTokens: undefined,
        inputTokenDetails: {
          cacheReadTokens: undefined,
          cacheWriteTokens: undefined,
          noCacheTokens: 0,
        },
        inputTokens: 0,
        outputTokenDetails: {
          reasoningTokens: undefined,
          textTokens: 0,
        },
        outputTokens: 0,
        reasoningTokens: undefined,
        raw: undefined,
        totalTokens: 0,
      }),
    });

    const recordId = response.headers.get("x-content-review-record-id");

    await response.text();
    expect(getContentReviewRecord(recordId ?? "")).toMatchObject({
      id: recordId,
      result: null,
      status: "error",
    });
  });
});
