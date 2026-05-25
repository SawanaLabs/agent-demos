import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import { buildTraceEvalSnapshot } from "./trace-eval-snapshot";

function createAssistantMessage({
  answer,
  parts,
  metadata,
}: {
  answer: string;
  metadata?: {
    finishReason?: string;
    finishedAt?: number;
    model?: string;
    runId?: string;
    searchTool?: string;
    startedAt?: number;
    totalUsage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    };
  };
  parts?: UIMessage["parts"];
}): UIMessage {
  return {
    id: "a1",
    metadata,
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

describe("buildTraceEvalSnapshot", () => {
  it("summarizes a grounded research run that used Gateway search", () => {
    const messages: UIMessage[] = [
      {
        id: "u1",
        parts: [
          {
            text: "Research how browser-use agents compare with Playwright-based agents for product QA workflows.",
            type: "text",
          },
        ],
        role: "user",
      },
      createAssistantMessage({
        answer:
          "Browser-use agents are stronger when the workflow needs higher-level task planning around a live page, while Playwright remains stronger when the workflow needs deterministic selectors, explicit assertions, and stable CI replay. The session should usually combine web search evidence with at least two cited sources before recommending an automation stack.",
        metadata: {
          finishedAt: 1200,
          model: "openai/gpt-5-mini",
          runId: "run_123",
          searchTool: "web_search",
          startedAt: 1000,
          totalUsage: {
            inputTokens: 420,
            outputTokens: 180,
            totalTokens: 600,
          },
        },
        parts: [
          {
            input: {
              query:
                "browser-use agent vs playwright product QA workflows comparison",
            },
            output: {
              findings: ["source-one", "source-two"],
            },
            state: "output-available",
            toolCallId: "call_1",
            type: "tool-web_search",
          },
          {
            providerMetadata: undefined,
            sourceId: "src_1",
            title: "Browser Use vs Playwright",
            type: "source-url",
            url: "https://example.com/browser-use-vs-playwright",
          },
          {
            providerMetadata: undefined,
            sourceId: "src_2",
            title: "Playwright for QA Automation",
            type: "source-url",
            url: "https://example.com/playwright-qa",
          },
        ],
      }),
    ];

    const snapshot = buildTraceEvalSnapshot(messages, false);

    expect(snapshot.status).toBe("complete");
    expect(snapshot.durationMs).toBe(200);
    expect(snapshot.runId).toBe("run_123");
    expect(snapshot.totalTokens).toBe(600);
    expect(snapshot.summary).toEqual({
      failed: 0,
      passed: 4,
      skipped: 0,
      total: 4,
    });
    expect(snapshot.score).toBe(1);
    expect(snapshot.checks.map((check) => check.id)).not.toContain(
      "token-budget"
    );
    expect(snapshot.sources).toHaveLength(2);
    expect(snapshot.trace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "tool",
          status: "passed",
          title: "web_search",
        }),
        expect.objectContaining({
          kind: "source",
          metric: "2 sources",
        }),
        expect.objectContaining({
          kind: "usage",
          metric: "600 tokens",
        }),
      ])
    );
  });

  it("marks the session as failed when the answer skipped search and sources", () => {
    const messages: UIMessage[] = [
      {
        id: "u1",
        parts: [
          {
            text: "Research the latest AI Gateway search tool behavior.",
            type: "text",
          },
        ],
        role: "user",
      },
      createAssistantMessage({
        answer: "It seems useful.",
      }),
    ];

    const snapshot = buildTraceEvalSnapshot(messages, false);

    expect(snapshot.status).toBe("complete");
    expect(snapshot.score).toBe(0.25);
    expect(snapshot.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "research-query",
          status: "passed",
        }),
        expect.objectContaining({
          id: "gateway-search",
          status: "failed",
        }),
        expect.objectContaining({
          id: "source-coverage",
          status: "failed",
        }),
        expect.objectContaining({
          id: "answer-shape",
          status: "failed",
        }),
      ])
    );
    expect(snapshot.checks.map((check) => check.id)).not.toContain(
      "token-budget"
    );
  });

  it("skips non-research chat prompts", () => {
    const messages: UIMessage[] = [
      {
        id: "u1",
        parts: [
          {
            text: "hi",
            type: "text",
          },
        ],
        role: "user",
      },
      createAssistantMessage({
        answer: "Hello there.",
      }),
    ];

    const snapshot = buildTraceEvalSnapshot(messages, false);

    expect(snapshot.score).toBe(0);
    expect(snapshot.summary).toEqual({
      failed: 0,
      passed: 0,
      skipped: 4,
      total: 4,
    });
    expect(snapshot.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "research-query",
          status: "skipped",
        }),
        expect.objectContaining({
          id: "gateway-search",
          status: "skipped",
        }),
      ])
    );
    expect(snapshot.trace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "request",
          status: "pending",
        }),
      ])
    );
  });

  it("derives source links from the latest answer markdown when source parts are missing", () => {
    const messages: UIMessage[] = [
      {
        id: "u1",
        parts: [
          {
            text: "Compare tracing stacks for AI agents.",
            type: "text",
          },
        ],
        role: "user",
      },
      createAssistantMessage({
        answer:
          "Langfuse focuses on prompt tracing and observation ([Langfuse docs](https://langfuse.com/docs/observability/overview)), while Braintrust leans into experiment management and evaluations ([Braintrust docs](https://www.braintrust.dev/docs/guides/evals/overview)). OpenTelemetry stays provider-neutral and fits broader platform instrumentation.",
        metadata: {
          finishedAt: 2200,
          model: "openai/gpt-5-mini",
          runId: "run_derived_links",
          searchTool: "web_search",
          startedAt: 2000,
          totalUsage: {
            inputTokens: 900,
            outputTokens: 250,
            totalTokens: 1150,
          },
        },
        parts: [
          {
            input: {
              query: "langfuse braintrust opentelemetry agent tracing compare",
            },
            output: {},
            state: "output-available",
            toolCallId: "call_search",
            type: "tool-web_search",
          },
        ],
      }),
    ];

    const snapshot = buildTraceEvalSnapshot(messages, false);

    expect(snapshot.sources).toEqual([
      expect.objectContaining({
        origin: "markdown-link",
        title: "Langfuse docs",
        url: "https://langfuse.com/docs/observability/overview",
      }),
      expect.objectContaining({
        origin: "markdown-link",
        title: "Braintrust docs",
        url: "https://www.braintrust.dev/docs/guides/evals/overview",
      }),
    ]);
    expect(snapshot.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "source-coverage",
          status: "passed",
        }),
      ])
    );
  });
});
