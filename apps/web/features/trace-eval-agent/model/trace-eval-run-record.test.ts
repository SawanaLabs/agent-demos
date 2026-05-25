import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import { buildTraceEvalRunRecord } from "./trace-eval-run-record";

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
    id: "assistant_1",
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

describe("buildTraceEvalRunRecord", () => {
  it("derives a normalized single-run record from a grounded research answer", () => {
    const messages: UIMessage[] = [
      {
        id: "user_1",
        parts: [
          {
            text: "Research the latest tracing and eval options for a Next.js AI agent.",
            type: "text",
          },
        ],
        role: "user",
      },
      createAssistantMessage({
        answer:
          "Langfuse is the fastest integrated path for a Next.js team, while Braintrust is stronger for experiment workflows and OpenTelemetry is the lower-level choice when the platform team already owns observability.",
        metadata: {
          finishReason: "stop",
          finishedAt: 1200,
          model: "openai/gpt-4.1-mini",
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
              query: "latest nextjs ai agent trace eval comparison",
            },
            output: {
              sources: ["langfuse", "braintrust"],
            },
            state: "output-available",
            toolCallId: "call_1",
            type: "tool-web_search",
          },
          {
            providerMetadata: undefined,
            sourceId: "src_1",
            title: "Langfuse docs",
            type: "source-url",
            url: "https://langfuse.com/docs",
          },
          {
            providerMetadata: undefined,
            sourceId: "src_2",
            title: "Braintrust docs",
            type: "source-url",
            url: "https://www.braintrust.dev/docs",
          },
        ],
      }),
    ];

    const record = buildTraceEvalRunRecord(messages, false);

    expect(record).toEqual(
      expect.objectContaining({
        durationMs: 200,
        finishReason: "stop",
        hasResearchIntent: true,
        latestAnswer: expect.stringContaining("Langfuse"),
        latestPrompt:
          "Research the latest tracing and eval options for a Next.js AI agent.",
        model: "openai/gpt-4.1-mini",
        runId: "run_123",
        searchTool: "web_search",
        status: "complete",
        totalTokens: 600,
      })
    );
    expect(record.searchCalls).toEqual([
      expect.objectContaining({
        id: "call_1-0",
        name: "web_search",
        status: "passed",
      }),
    ]);
    expect(record.sources).toEqual([
      expect.objectContaining({
        title: "Langfuse docs",
      }),
      expect.objectContaining({
        title: "Braintrust docs",
      }),
    ]);
  });

  it("keeps a casual chat turn available to the agent while marking it as non-research", () => {
    const messages: UIMessage[] = [
      {
        id: "user_1",
        parts: [
          {
            text: "hi",
            type: "text",
          },
        ],
        role: "user",
      },
      createAssistantMessage({
        answer: "Hello! How can I assist you today?",
      }),
    ];

    const record = buildTraceEvalRunRecord(messages, false);

    expect(record.status).toBe("complete");
    expect(record.latestPrompt).toBe("hi");
    expect(record.latestAnswer).toBe("Hello! How can I assist you today?");
    expect(record.hasResearchIntent).toBe(false);
    expect(record.searchCalls).toEqual([]);
    expect(record.sources).toEqual([]);
  });
});
