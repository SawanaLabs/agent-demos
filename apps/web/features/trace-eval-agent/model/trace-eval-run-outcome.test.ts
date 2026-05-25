import { describe, expect, it } from "vitest";
import { classifyTraceEvalRunOutcome } from "./trace-eval-run-outcome";
import { buildTraceEvalRunRecord } from "./trace-eval-run-record";

describe("classifyTraceEvalRunOutcome", () => {
  it("skips casual chat turns without starting evaluation", () => {
    const record = buildTraceEvalRunRecord(
      [
        {
          id: "user_1",
          parts: [{ text: "hi", type: "text" as const }],
          role: "user" as const,
        },
        {
          id: "assistant_1",
          parts: [{ text: "Hello there.", type: "text" as const }],
          role: "assistant" as const,
        },
      ],
      false
    );

    expect(classifyTraceEvalRunOutcome({ record })).toEqual(
      expect.objectContaining({
        kind: "skipped",
        reason: "non-research-turn",
        shouldJudge: false,
      })
    );
  });

  it("surfaces provider errors as failed runs instead of judge work", () => {
    const record = buildTraceEvalRunRecord(
      [
        {
          id: "user_1",
          parts: [
            {
              text: "Research the current Langfuse tracing story.",
              type: "text" as const,
            },
          ],
          role: "user" as const,
        },
      ],
      false
    );

    expect(
      classifyTraceEvalRunOutcome({
        error: new Error("input.2.output: Invalid input"),
        record,
      })
    ).toEqual(
      expect.objectContaining({
        detail: "input.2.output: Invalid input",
        kind: "failed-run",
        reason: "provider-error",
        shouldJudge: false,
      })
    );
  });

  it("keeps grounded research runs evaluable", () => {
    const record = buildTraceEvalRunRecord(
      [
        {
          id: "user_1",
          parts: [
            {
              text: "Research the latest tracing and eval options for a Next.js AI agent.",
              type: "text" as const,
            },
          ],
          role: "user" as const,
        },
        {
          id: "assistant_1",
          metadata: {
            finishedAt: 1200,
            searchTool: "web_search",
            startedAt: 1000,
          },
          parts: [
            {
              input: { query: "latest tracing eval nextjs ai agent" },
              output: {},
              state: "output-available" as const,
              toolCallId: "call_1",
              type: "tool-web_search" as const,
            },
            {
              sourceId: "src_1",
              title: "Source one",
              type: "source-url" as const,
              url: "https://example.com/one",
            },
            {
              sourceId: "src_2",
              title: "Source two",
              type: "source-url" as const,
              url: "https://example.com/two",
            },
            {
              text: "Langfuse is the fastest integrated path, Braintrust is stronger for eval workflows, and OpenTelemetry is the lowest-level portability option for teams that already own observability.",
              type: "text" as const,
            },
          ],
          role: "assistant" as const,
        },
      ],
      false
    );

    expect(classifyTraceEvalRunOutcome({ record })).toEqual(
      expect.objectContaining({
        kind: "evaluated",
        shouldJudge: true,
      })
    );
  });
});
