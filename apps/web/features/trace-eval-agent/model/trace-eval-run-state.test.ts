import { describe, expect, it } from "vitest";
import {
  hasTraceEvalFailedGeneration,
  isTraceEvalRefusalAnswer,
  shouldEvaluateTraceEvalSnapshot,
} from "./trace-eval-run-state";
import { buildTraceEvalSnapshot } from "./trace-eval-snapshot";

describe("trace eval run state", () => {
  it("classifies refusal answers as failed generations", () => {
    expect(
      isTraceEvalRefusalAnswer(
        "I'm sorry, but I cannot assist with that request."
      )
    ).toBe(true);
    expect(
      isTraceEvalRefusalAnswer(
        "Langfuse is usually the fastest path if you want built-in traces and evals."
      )
    ).toBe(false);
  });

  it("skips the LLM judge for refusal answers", () => {
    const snapshot = buildTraceEvalSnapshot(
      [
        {
          id: "user_1",
          parts: [{ text: "Give me a quick opinion.", type: "text" as const }],
          role: "user" as const,
        },
        {
          id: "assistant_1",
          parts: [
            {
              text: "I'm sorry, but I cannot assist with that request.",
              type: "text" as const,
            },
          ],
          role: "assistant" as const,
        },
      ],
      false
    );

    expect(shouldEvaluateTraceEvalSnapshot(snapshot)).toBe(false);
  });

  it("marks prompt-only completed runs as failed generations", () => {
    const snapshot = buildTraceEvalSnapshot(
      [
        {
          id: "user_1",
          parts: [
            { text: "Compare Langfuse and Braintrust.", type: "text" as const },
          ],
          role: "user" as const,
        },
      ],
      false
    );

    expect(hasTraceEvalFailedGeneration(snapshot)).toBe(true);
  });

  it("skips casual chat turns entirely", () => {
    const snapshot = buildTraceEvalSnapshot(
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

    expect(snapshot.summary).toEqual({
      failed: 0,
      passed: 0,
      skipped: 4,
      total: 4,
    });
    expect(shouldEvaluateTraceEvalSnapshot(snapshot)).toBe(false);
    expect(hasTraceEvalFailedGeneration(snapshot)).toBe(false);
  });

  it("allows completed grounded runs to reach the judge", () => {
    const snapshot = buildTraceEvalSnapshot(
      [
        {
          id: "user_1",
          parts: [
            {
              text: "Pick a tracing stack for a Next.js AI agent.",
              type: "text" as const,
            },
          ],
          role: "user" as const,
        },
        {
          id: "assistant_1",
          metadata: {
            finishedAt: 1800,
            startedAt: 1000,
          },
          parts: [
            {
              input: { query: "Langfuse Braintrust OpenTelemetry comparison" },
              output: {},
              state: "output-available" as const,
              toolCallId: "tool_1",
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
              text: "Langfuse is the fastest production path for a Next.js team because it combines tracing and evaluation in one product, while Braintrust is stronger when you want experiment workflows and OpenTelemetry is the lowest-level option when you already own the observability stack.",
              type: "text" as const,
            },
          ],
          role: "assistant" as const,
        },
      ],
      false
    );

    expect(shouldEvaluateTraceEvalSnapshot(snapshot)).toBe(true);
  });
});
