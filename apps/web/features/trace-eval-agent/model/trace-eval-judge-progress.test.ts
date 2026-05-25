import type { DeepPartial } from "ai";
import { describe, expect, it } from "vitest";

import type { TraceEvalJudgeStreamObject } from "./trace-eval-judge";
import { deriveTraceEvalJudgeProgress } from "./trace-eval-judge-progress";

describe("deriveTraceEvalJudgeProgress", () => {
  it("starts at the initial loading stage before any structured fields arrive", () => {
    expect(deriveTraceEvalJudgeProgress(null)).toMatchObject({
      label: "Starting",
      progress: 0.08,
      step: "starting",
    });
  });

  it("moves to summary streaming when the top-level summary arrives", () => {
    const partial: DeepPartial<TraceEvalJudgeStreamObject> = {
      summary: "This run is promising.",
    };

    expect(deriveTraceEvalJudgeProgress(partial)).toMatchObject({
      label: "Streaming summary",
      progress: 0.32,
      step: "summary",
    });
  });

  it("moves to dimension scoring when at least one dimension has streamed in", () => {
    const partial: DeepPartial<TraceEvalJudgeStreamObject> = {
      dimensions: [
        {
          id: "answer-usefulness",
          rationale: "Useful.",
          score: 0.9,
          title: "Answer usefulness",
        },
      ],
      overallScore: 0.9,
      summary: "Strong run.",
    };

    expect(deriveTraceEvalJudgeProgress(partial)).toMatchObject({
      label: "Scoring dimensions",
      progress: 0.72,
      step: "dimensions",
    });
  });

  it("moves to finalizing when the streamed object already contains an action", () => {
    const partial: DeepPartial<TraceEvalJudgeStreamObject> = {
      action: "ready",
      dimensions: [
        {
          id: "answer-usefulness",
          rationale: "Useful.",
          score: 0.9,
          title: "Answer usefulness",
        },
      ],
      overallScore: 0.9,
      rationale: "Grounded and useful.",
      summary: "Strong run.",
    };

    expect(deriveTraceEvalJudgeProgress(partial)).toMatchObject({
      label: "Finalizing recommendation",
      progress: 0.92,
      step: "finalizing",
    });
  });
});
