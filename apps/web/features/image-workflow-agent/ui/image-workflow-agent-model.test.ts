import { describe, expect, it } from "vitest";

import { createDefaultWorkflowGraph } from "../model/workflow-engine";
import {
  getLatestWorkflowGraph,
  getWorkflowToolDisplayOutput,
} from "./image-workflow-agent-model";

describe("image workflow agent UI model", () => {
  it("prefers the highest revision graph from streamed tool outputs", () => {
    const baseGraph = createDefaultWorkflowGraph();
    const newerGraph = {
      ...baseGraph,
      revision: 4,
    };

    expect(
      getLatestWorkflowGraph([
        {
          id: "m1",
          parts: [
            {
              input: {},
              output: {
                graph: baseGraph,
                summary: "Updated node generator-1.",
              },
              state: "output-available" as const,
              toolCallId: "call-1",
              type: "tool-updateNode",
            },
          ],
          role: "assistant",
        },
        {
          id: "m2",
          parts: [
            {
              input: {},
              output: {
                graph: newerGraph,
                summary: "Ran the workflow successfully.",
              },
              state: "output-available" as const,
              toolCallId: "call-2",
              type: "tool-runWorkflow",
            },
          ],
          role: "assistant",
        },
      ])
    ).toEqual(newerGraph);
  });

  it("renders only a tool summary instead of raw graph image data", () => {
    const graph = createDefaultWorkflowGraph();
    const output = {
      graph,
      image: {
        dataUrl: "data:image/png;base64,c2Vuc2l0aXZlLWltYWdl",
        mediaType: "image/png",
      },
      kind: "workflow-run",
      summary: "Ran the workflow successfully.",
    };

    expect(getWorkflowToolDisplayOutput(output)).toBe(
      "Ran the workflow successfully."
    );
    expect(JSON.stringify(getWorkflowToolDisplayOutput(output))).not.toContain(
      "c2Vuc2l0aXZlLWltYWdl"
    );
  });
});
