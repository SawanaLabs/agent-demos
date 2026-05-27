import { afterEach, describe, expect, it } from "vitest";

import {
  clearObjectGenerationRecordsForTest,
  getObjectGenerationRecord,
} from "./object-generation-records";
import { startRecordedObjectGenerationRun } from "./recorded-object-generation-run";

describe("recorded review run", () => {
  afterEach(() => {
    clearObjectGenerationRecordsForTest();
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

    const response = startRecordedObjectGenerationRun({
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

    const recordId = response.headers.get("x-object-generation-record-id");

    expect(recordId).toBeTruthy();
    await expect(response.text()).resolves.toEqual(JSON.stringify(finalObject));
    expect(getObjectGenerationRecord(recordId ?? "")).toMatchObject({
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
    const response = startRecordedObjectGenerationRun({
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

    const recordId = response.headers.get("x-object-generation-record-id");

    await response.text();
    expect(getObjectGenerationRecord(recordId ?? "")).toMatchObject({
      id: recordId,
      result: null,
      status: "error",
    });
  });
});
