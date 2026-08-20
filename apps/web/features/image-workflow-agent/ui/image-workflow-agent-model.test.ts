import type { UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";

import { createDefaultWorkflowGraph } from "../model/workflow-engine";
import {
  applyWorkflowNodeChanges,
  commitAcceptedWorkflowGraph,
  getLatestWorkflowGraph,
  getUnconsumedWorkflowActions,
  getWorkflowToolDisplayOutput,
  shouldTrackWorkflowNodeChanges,
  shouldTrackWorkflowNodePatch,
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

  it("returns each accepted streamed action once across repeated message scans", () => {
    const graph = createDefaultWorkflowGraph();
    const messages: UIMessage[] = [
      {
        id: "m1",
        parts: [
          {
            input: {},
            output: {
              acceptedAction: {
                action: "modify_workflow",
                source: "agent",
              },
              graph,
              summary: "Updated node generator-1.",
            },
            state: "output-available" as const,
            toolCallId: "call-1",
            type: "tool-updateNode",
          },
          {
            input: {},
            output: {
              acceptedAction: {
                action: "run_workflow",
                hasReferenceImage: true,
                prompt: "must not escape",
                source: "agent",
              },
              graph,
              summary: "Ran workflow.",
            },
            state: "output-available" as const,
            toolCallId: "call-2",
            type: "tool-runWorkflow",
          },
        ],
        role: "assistant" as const,
      },
    ];

    const firstScan = getUnconsumedWorkflowActions(messages, new Set());
    const secondScan = getUnconsumedWorkflowActions(
      messages,
      new Set([firstScan[0]?.id ?? "missing"])
    );

    expect(firstScan).toEqual([
      {
        action: {
          action: "modify_workflow",
          source: "agent",
        },
        id: "m1:call-1",
      },
      {
        action: {
          action: "run_workflow",
          hasReferenceImage: true,
          source: "agent",
        },
        id: "m1:call-2",
      },
    ]);
    expect(secondScan).toEqual([firstScan[1]]);
    expect(JSON.stringify(firstScan)).not.toContain("must not escape");
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

  it("tracks only committed React Flow changes", () => {
    expect(
      shouldTrackWorkflowNodeChanges([
        {
          dragging: true,
          id: "generator-1",
          position: { x: 20, y: 40 },
          type: "position",
        },
      ])
    ).toBe(false);
    expect(
      shouldTrackWorkflowNodeChanges([
        {
          dragging: false,
          id: "generator-1",
          position: { x: 80, y: 120 },
          type: "position",
        },
      ])
    ).toBe(true);
    expect(
      shouldTrackWorkflowNodeChanges([{ id: "reference-1", type: "remove" }])
    ).toBe(true);
    expect(
      shouldTrackWorkflowNodeChanges([
        { id: "generator-1", selected: true, type: "select" },
      ])
    ).toBe(false);
  });

  it("updates the controlled graph during and after a node drag", () => {
    const graph = createDefaultWorkflowGraph();
    const draggingGraph = applyWorkflowNodeChanges(graph, [
      {
        dragging: true,
        id: "generator-1",
        position: { x: 20, y: 40 },
        type: "position",
      },
    ]);
    const committedGraph = applyWorkflowNodeChanges(draggingGraph, [
      {
        dragging: false,
        id: "generator-1",
        position: { x: 80, y: 120 },
        type: "position",
      },
    ]);

    expect(
      draggingGraph.nodes.find((node) => node.id === "generator-1")
    ).toMatchObject({ position: { x: 20, y: 40 } });
    expect(
      committedGraph.nodes.find((node) => node.id === "generator-1")
    ).toMatchObject({ position: { x: 80, y: 120 } });
    expect(committedGraph.revision).toBe(graph.revision + 2);
  });

  it("returns the same graph for React Flow bookkeeping changes", () => {
    const graph = createDefaultWorkflowGraph();

    expect(
      applyWorkflowNodeChanges(graph, [
        { id: "generator-1", type: "dimensions" },
        { id: "generator-1", selected: true, type: "select" },
      ])
    ).toBe(graph);
  });
});

describe("image workflow accepted graph synchronization", () => {
  it("commits an accepted graph without a deferred stale-state window", () => {
    const graph = createDefaultWorkflowGraph();
    const acceptedGraph = { ...graph, revision: graph.revision + 2 };
    const graphRef = { current: graph };
    const commit = vi.fn();

    commitAcceptedWorkflowGraph(graphRef, acceptedGraph, commit);

    expect(graphRef.current).toBe(acceptedGraph);
    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith(acceptedGraph);
  });
});

describe("image workflow analytics policy", () => {
  it("keeps upload-only reference image changes out of product analytics", () => {
    expect(
      shouldTrackWorkflowNodePatch({
        image: {
          dataUrl: "data:image/png;base64,cHJpdmF0ZQ==",
          fileName: "private.png",
        },
      })
    ).toBe(false);
    expect(shouldTrackWorkflowNodePatch({ image: null })).toBe(false);
    expect(shouldTrackWorkflowNodePatch({ aspectRatio: "16:9" })).toBe(true);
  });
});
