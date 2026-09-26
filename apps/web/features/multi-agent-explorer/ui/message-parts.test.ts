import { describe, expect, it } from "vitest";

import type { MultiAgentExplorerUIMessage } from "../types";
import { projectMultiAgentExplorerMessage } from "./message-parts";

describe("multi-agent explorer message projection", () => {
  it("separates orchestration data parts from report text and reasoning", () => {
    const message: MultiAgentExplorerUIMessage = {
      id: "assistant-1",
      parts: [
        {
          data: { detail: "Planning", phase: "planning" },
          id: "orchestration",
          type: "data-orchestration-phase",
        },
        {
          data: {
            question: "When does fan-out help?",
            subtopics: [
              { angle: "benefits", title: "Fan-out benefits" },
              { angle: "risks", title: "Fan-out risks" },
            ],
          },
          id: "research-plan",
          type: "data-research-plan",
        },
        {
          data: {
            activities: [
              {
                input: { query: "fan-out" },
                output: { results: [{ noteId: "explorer-fanout-research" }] },
                status: "done",
                toolCallId: "call-1",
                toolName: "search_notes",
              },
            ],
            angle: "benefits",
            explorerId: "explorer-1",
            findings: "Parallel subagents cut latency.",
            status: "done",
            subtopic: "Fan-out benefits",
          },
          id: "explorer-1",
          type: "data-explorer",
        },
        {
          data: {
            activities: [],
            angle: "risks",
            explorerId: "explorer-2",
            status: "running",
            subtopic: "Fan-out risks",
          },
          id: "explorer-2",
          type: "data-explorer",
        },
        { text: "Checking explorer coverage.", type: "reasoning" },
        { text: "Here is the synthesized report.", type: "text" },
      ],
      role: "assistant",
    };

    const projection = projectMultiAgentExplorerMessage(message);

    expect(projection.orchestration?.phase).toBe("planning");
    expect(projection.plan?.subtopics).toHaveLength(2);
    expect(projection.explorerParts.map((part) => part.explorerId)).toEqual([
      "explorer-1",
      "explorer-2",
    ]);
    expect(projection.explorerParts[0]?.activities[0]?.toolName).toBe(
      "search_notes"
    );
    expect(projection.hasReasoningSignal).toBe(true);
    expect(projection.text).toBe("Here is the synthesized report.");
  });

  it("drops malformed data parts instead of failing the projection", () => {
    const message = {
      id: "assistant-2",
      parts: [
        {
          data: { phase: 42 },
          id: "orchestration",
          type: "data-orchestration-phase",
        },
        {
          data: { notASnapshot: true },
          id: "explorer-1",
          type: "data-explorer",
        },
        { text: "Report text.", type: "text" },
      ],
      role: "assistant",
    } as unknown as MultiAgentExplorerUIMessage;

    const projection = projectMultiAgentExplorerMessage(message);

    expect(projection.orchestration).toBeUndefined();
    expect(projection.explorerParts).toEqual([]);
    expect(projection.text).toBe("Report text.");
  });
});
