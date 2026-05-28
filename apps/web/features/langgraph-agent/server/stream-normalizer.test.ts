import { describe, expect, it } from "vitest";

import { createLangGraphStreamNormalizer } from "./stream-normalizer";

describe("LangGraph stream normalizer", () => {
  it("maps official LangGraph update and message stream events into UI chunks", () => {
    const normalizer = createLangGraphStreamNormalizer({
      textPartId: "answer",
    });

    expect(
      normalizer.normalize({
        data: {
          plan: {
            next: "Call the validation tool, then synthesize the answer.",
          },
        },
        event: "updates",
      })
    ).toEqual([
      {
        data: {
          kind: "node-update",
          node: "plan",
          source: "updates",
          state: {
            next: "Call the validation tool, then synthesize the answer.",
          },
          status: "completed",
        },
        id: "node-plan",
        transient: false,
        type: "data-graph-progress",
      },
    ]);

    expect(
      normalizer.normalize({
        data: [
          {
            content: "The official integration path is working.",
          },
          {
            langgraph_node: "answer",
            run_id: "run-1",
          },
        ],
        event: "messages-tuple",
      })
    ).toEqual([
      {
        data: {
          kind: "node-token",
          node: "answer",
          runId: "run-1",
          source: "messages-tuple",
          status: "streaming",
        },
        id: "node-answer",
        transient: true,
        type: "data-graph-progress",
      },
      {
        id: "answer",
        type: "text-start",
      },
      {
        delta: "The official integration path is working.",
        id: "answer",
        type: "text-delta",
      },
    ]);

    expect(normalizer.finish()).toEqual([
      {
        id: "answer",
        type: "text-end",
      },
    ]);
  });
});
