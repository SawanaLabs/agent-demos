import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  buildTraceEvalJudgeContext,
  completeTraceEvalJudgeResult,
} from "./trace-eval-judge";
import { buildTraceEvalSnapshot } from "./trace-eval-snapshot";

function createUserMessage(text: string): UIMessage {
  return {
    id: "u1",
    parts: [{ text, type: "text" }],
    role: "user",
  };
}

function createAssistantMessage({
  answer,
  parts,
}: {
  answer: string;
  parts?: UIMessage["parts"];
}): UIMessage {
  return {
    id: "a1",
    metadata: {
      finishedAt: 1600,
      model: "openai/gpt-5-mini",
      runId: "run_judge_test",
      searchTool: "web_search",
      startedAt: 1000,
      totalUsage: {
        inputTokens: 800,
        outputTokens: 240,
        totalTokens: 1040,
      },
    },
    parts: [
      ...(parts ?? []),
      {
        text: answer,
        type: "text",
      },
    ],
    role: "assistant",
  };
}

describe("buildTraceEvalJudgeContext", () => {
  it("keeps deterministic failures visible while building the judge context", () => {
    const messages: UIMessage[] = [
      createUserMessage("Research the latest AI Gateway web search behavior."),
      createAssistantMessage({
        answer: "It is probably useful for current research.",
      }),
    ];
    const snapshot = buildTraceEvalSnapshot(messages, false);

    const context = buildTraceEvalJudgeContext(snapshot);

    expect(context.prompt).toBe(
      "Research the latest AI Gateway web search behavior."
    );
    expect(context.answer).toBe("It is probably useful for current research.");
    expect(context.usage).toEqual({
      durationMs: 600,
      totalTokens: 1040,
    });
    expect(context.deterministicFailures).toEqual([
      expect.objectContaining({ id: "gateway-search" }),
      expect.objectContaining({ id: "source-coverage" }),
      expect.objectContaining({ id: "answer-shape" }),
    ]);
    expect(context.rubric.map((dimension) => dimension.id)).toEqual([
      "answer-usefulness",
      "source-faithfulness",
      "evidence-sufficiency",
      "uncertainty-handling",
      "run-discipline",
    ]);
  });

  it("captures answer, sources, trace, and deterministic checks for grounded runs", () => {
    const messages: UIMessage[] = [
      createUserMessage("Compare AI tracing tools for a Next.js agent team."),
      createAssistantMessage({
        answer:
          "Langfuse, Braintrust, and OpenTelemetry cover different operating needs. Langfuse is useful for prompt and trace inspection, Braintrust is stronger for eval experiments, and OpenTelemetry is the portability baseline for platform teams.",
        parts: [
          {
            input: {
              query: "Langfuse Braintrust OpenTelemetry agent tracing evals",
            },
            output: {
              findings: ["langfuse", "braintrust"],
            },
            state: "output-available",
            toolCallId: "call_search",
            type: "tool-web_search",
          },
          {
            providerMetadata: undefined,
            sourceId: "src_langfuse",
            title: "Langfuse docs",
            type: "source-url",
            url: "https://langfuse.com/docs",
          },
          {
            providerMetadata: undefined,
            sourceId: "src_braintrust",
            title: "Braintrust docs",
            type: "source-url",
            url: "https://www.braintrust.dev/docs",
          },
        ],
      }),
    ];
    const snapshot = buildTraceEvalSnapshot(messages, false);

    const context = buildTraceEvalJudgeContext(snapshot);

    expect(context.answer).toContain("Langfuse, Braintrust");
    expect(context.sources).toHaveLength(2);
    expect(context.trace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "tool", title: "web_search" }),
        expect.objectContaining({ kind: "usage", metric: "1040 tokens" }),
      ])
    );
    expect(context.deterministicFailures).toEqual([]);
    expect(context.deterministicChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "gateway-search",
          status: "passed",
        }),
      ])
    );
  });

  it("completes streamed judge output with deterministic failures and final action", () => {
    const messages: UIMessage[] = [
      createUserMessage("Research the latest AI Gateway web search behavior."),
      createAssistantMessage({
        answer: "It is probably useful for current research.",
      }),
    ];
    const snapshot = buildTraceEvalSnapshot(messages, false);

    const result = completeTraceEvalJudgeResult({
      deterministicFailures: snapshot.checks.filter(
        (check) => check.status === "failed"
      ),
      evaluatedAt: "2026-05-25T12:00:00.000Z",
      judge: {
        action: "ready",
        dimensions: [
          {
            id: "answer-usefulness",
            rationale: "The answer is thin.",
            score: 0.35,
            title: "Answer usefulness",
          },
        ],
        overallScore: 0.35,
        rationale: "The run omitted required evidence.",
        summary: "The answer needs a research rerun.",
      },
      model: "openai/gpt-5-mini",
    });

    expect(result).toMatchObject({
      action: "rerun-research",
      deterministicFailures: [
        expect.objectContaining({ id: "gateway-search" }),
        expect.objectContaining({ id: "source-coverage" }),
        expect.objectContaining({ id: "answer-shape" }),
      ],
      evaluatedAt: "2026-05-25T12:00:00.000Z",
      model: "openai/gpt-5-mini",
      overallScore: 0.35,
    });
  });
});
