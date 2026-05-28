import { describe, expect, it } from "vitest";

import type { LangGraphProgressData } from "../server/stream-normalizer";
import { getLangGraphThinkingText } from "./langgraph-agent-message-parts";

describe("LangGraph agent message parts", () => {
  it("formats graph progress into message-level thinking text", () => {
    const events: LangGraphProgressData[] = [
      {
        kind: "node-update",
        node: "route",
        source: "updates",
        state: {
          route: "integration",
        },
        status: "completed",
      },
      {
        kind: "node-update",
        node: "plan",
        source: "updates",
        state: {
          plan: "Call the validation tool, then synthesize the answer.",
        },
        status: "completed",
      },
      {
        kind: "node-update",
        node: "tool",
        source: "updates",
        state: {
          observations: ["Use POST /threads/{thread_id}/runs/stream."],
        },
        status: "completed",
      },
      {
        kind: "node-token",
        node: "answer",
        runId: "run-1",
        source: "messages-tuple",
        status: "streaming",
      },
    ];

    expect(getLangGraphThinkingText(events)).toBe(
      [
        "- Route request: integration",
        "- Plan response: Call the validation tool, then synthesize the answer.",
        "- Inspect frontend contract: Use POST /threads/{thread_id}/runs/stream.",
        "- Stream answer: Streaming answer tokens.",
      ].join("\n")
    );
  });

  it("returns an empty string before LangGraph emits progress", () => {
    expect(getLangGraphThinkingText([])).toBe("");
  });

  it("summarizes a completed answer update after token streaming finishes", () => {
    expect(
      getLangGraphThinkingText([
        {
          kind: "node-token",
          node: "answer",
          runId: "run-1",
          source: "messages",
          status: "streaming",
        },
        {
          kind: "node-update",
          node: "answer",
          source: "updates",
          state: {
            messages: [
              {
                content: "你好！有什么我可以帮你的吗？",
              },
            ],
          },
          status: "completed",
        },
      ])
    ).toBe("- Stream answer: Final answer completed.");
  });
});
