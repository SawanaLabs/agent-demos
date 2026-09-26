import type { TextStreamPart, ToolSet } from "ai";
import { describe, expect, it } from "vitest";

import {
  applyExplorerStreamPart,
  buildSynthesisPrompt,
  createExplorerRunState,
} from "./orchestrator";

function streamPart(part: Record<string, unknown>) {
  return part as unknown as TextStreamPart<ToolSet>;
}

describe("multi-agent explorer orchestration", () => {
  it("folds explorer stream parts into a live snapshot", () => {
    const state = createExplorerRunState({
      angle: "coverage",
      explorerId: "explorer-1",
      subtopic: "Fan-out trade-offs",
    });

    expect(
      applyExplorerStreamPart(
        state,
        streamPart({
          input: { query: "fan-out" },
          toolCallId: "call-1",
          toolName: "search_notes",
          type: "tool-call",
        })
      )
    ).toBe(true);
    expect(
      applyExplorerStreamPart(
        state,
        streamPart({
          output: { results: [{ noteId: "explorer-fanout-research" }] },
          toolCallId: "call-1",
          type: "tool-result",
        })
      )
    ).toBe(true);
    expect(
      applyExplorerStreamPart(
        state,
        streamPart({
          text: "Fan-out wins when subtasks are independent.",
          type: "text-delta",
        })
      )
    ).toBe(false);

    expect(state.snapshot.activities).toEqual([
      {
        input: { query: "fan-out" },
        output: { results: [{ noteId: "explorer-fanout-research" }] },
        status: "done",
        toolCallId: "call-1",
        toolName: "search_notes",
      },
    ]);
    expect(state.findings).toBe("Fan-out wins when subtasks are independent.");
    expect(state.snapshot.status).toBe("running");
  });

  it("marks a tool call as failed and records stream errors", () => {
    const state = createExplorerRunState({
      angle: "coverage",
      explorerId: "explorer-2",
      subtopic: "Failure modes",
    });

    applyExplorerStreamPart(
      state,
      streamPart({
        input: {},
        toolCallId: "call-9",
        toolName: "read_note",
        type: "tool-call",
      })
    );
    expect(
      applyExplorerStreamPart(
        state,
        streamPart({ toolCallId: "call-9", type: "tool-error" })
      )
    ).toBe(true);
    expect(
      applyExplorerStreamPart(
        state,
        streamPart({ error: new Error("model unavailable"), type: "error" })
      )
    ).toBe(true);

    expect(state.snapshot.activities[0]?.status).toBe("error");
    expect(state.snapshot.error).toBe("model unavailable");
  });

  it("builds a synthesis prompt that preserves explorer attribution", () => {
    const prompt = buildSynthesisPrompt({
      question: "When does fan-out help?",
      runs: [
        {
          angle: "benefits",
          explorerId: "explorer-1",
          findings:
            "Parallel subagents cut latency. [explorer-fanout-research]",
          status: "done",
          subtopic: "Fan-out benefits",
        },
        {
          angle: "risks",
          error: "model unavailable",
          explorerId: "explorer-2",
          findings: undefined,
          status: "error",
          subtopic: "Fan-out risks",
        },
      ],
    });

    expect(prompt).toContain("When does fan-out help?");
    expect(prompt).toContain("Explorer explorer-1 — Fan-out benefits");
    expect(prompt).toContain("Parallel subagents cut latency.");
    expect(prompt).toContain("Explorer failed: model unavailable");
  });
});
