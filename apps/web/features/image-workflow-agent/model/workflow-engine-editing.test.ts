import { describe, expect, it } from "vitest";

import {
  applyWorkflowCommand,
  buildWorkflowRunPlan,
  createDefaultWorkflowGraph,
  type WorkflowGraph,
} from "./workflow-engine";

describe("image workflow engine", () => {
  it("moves a node without changing its content", () => {
    const graph = createDefaultWorkflowGraph();

    const moved = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      nodeId: "generator-1",
      position: {
        x: 320,
        y: 260,
      },
      type: "move-node",
    });

    expect(moved.revision).toBe(1);
    expect(moved.nodes.find((node) => node.id === "generator-1")).toMatchObject(
      {
        data: {
          aspectRatio: "1:1",
          prompt: "",
        },
        position: {
          x: 320,
          y: 260,
        },
      }
    );
  });

  it("deletes the optional reference node and its connection", () => {
    const graph = createDefaultWorkflowGraph();
    const withReferenceNode = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      node: {
        data: {
          image: null,
          label: "Reference image",
        },
        id: "reference-1",
        kind: "reference-image",
        position: {
          x: 20,
          y: 180,
        },
      },
      type: "add-node",
    });
    const connected = applyWorkflowCommand(withReferenceNode, {
      expectedRevision: withReferenceNode.revision,
      sourceNodeId: "reference-1",
      targetNodeId: "generator-1",
      type: "connect-nodes",
    });

    const deleted = applyWorkflowCommand(connected, {
      expectedRevision: connected.revision,
      nodeId: "reference-1",
      type: "delete-node",
    });

    expect(deleted.revision).toBe(3);
    expect(deleted.nodes.map((node) => node.id)).toEqual([
      "generator-1",
      "result-1",
    ]);
    expect(deleted.edges).toEqual([
      {
        id: "generator-1->result-1",
        source: "generator-1",
        target: "result-1",
      },
    ]);
  });
});

describe("image workflow engine graph replacement", () => {
  it("replaces the workflow graph when the next graph keeps the supported shape", () => {
    const graph = createDefaultWorkflowGraph();
    const nextGraph = {
      ...graph,
      edges: [
        {
          id: "generator-1->result-1",
          source: "generator-1",
          target: "result-1",
        },
      ],
      nodes: graph.nodes.map((node) =>
        node.kind === "image-generator"
          ? {
              ...node,
              data: {
                ...node.data,
                aspectRatio: "16:9" as const,
                prompt: "A wide cinematic hero image",
              },
            }
          : node
      ),
      revision: graph.revision,
    };

    const replaced = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      graph: nextGraph,
      type: "replace-workflow",
    });

    expect(replaced.revision).toBe(1);
    expect(
      buildWorkflowRunPlan(replaced, {
        imageModel: "google/gemini-3.1-flash-lite-image",
      })
    ).toMatchObject({
      aspectRatio: "16:9",
      prompt: "A wide cinematic hero image",
      revision: 1,
    });
  });

  it("rejects replacement graphs with invalid node or edge structure", () => {
    const graph = createDefaultWorkflowGraph();
    const invalidShape = {
      ...graph,
      nodes: graph.nodes.filter((node) => node.kind !== "image-result"),
      revision: graph.revision,
    } satisfies WorkflowGraph;

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        graph: invalidShape,
        type: "replace-workflow",
      })
    ).toThrowError("Workflow graph shape is invalid.");

    const invalidEdge = {
      ...graph,
      edges: [
        {
          id: "result-1->generator-1",
          source: "result-1",
          target: "generator-1",
        },
      ],
      revision: graph.revision,
    } satisfies WorkflowGraph;

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        graph: invalidEdge,
        type: "replace-workflow",
      })
    ).toThrowError("Workflow graph edges are invalid.");
  });

  it("rejects a connected reference node when no image was uploaded", () => {
    const graph = createDefaultWorkflowGraph();
    const withReferenceNode = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      node: {
        data: {
          image: null,
          label: "Reference image",
        },
        id: "reference-1",
        kind: "reference-image",
        position: {
          x: 20,
          y: 180,
        },
      },
      type: "add-node",
    });
    const withPrompt = applyWorkflowCommand(withReferenceNode, {
      expectedRevision: withReferenceNode.revision,
      nodeId: "generator-1",
      patch: {
        prompt: "Edit this image into a campaign scene",
      },
      type: "update-node",
    });
    const connected = applyWorkflowCommand(withPrompt, {
      expectedRevision: withPrompt.revision,
      sourceNodeId: "reference-1",
      targetNodeId: "generator-1",
      type: "connect-nodes",
    });

    expect(() =>
      buildWorkflowRunPlan(connected, {
        imageModel: "google/gemini-3.1-flash-lite-image",
      })
    ).toThrowError(
      "Reference image is required for the connected reference node."
    );
  });

  it("rejects invalid reference image payloads", () => {
    const graph = createDefaultWorkflowGraph();
    const withReferenceNode = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      node: {
        data: {
          image: null,
          label: "Reference image",
        },
        id: "reference-1",
        kind: "reference-image",
        position: {
          x: 20,
          y: 180,
        },
      },
      type: "add-node",
    });

    expect(() =>
      applyWorkflowCommand(withReferenceNode, {
        expectedRevision: withReferenceNode.revision,
        nodeId: "reference-1",
        patch: {
          image: {
            dataUrl: "data:text/plain;base64,SGVsbG8=",
            filename: "reference.txt",
            mediaType: "text/plain",
            sizeBytes: 5,
          },
        },
        type: "update-node",
      })
    ).toThrowError("Reference image media type is invalid.");

    expect(() =>
      applyWorkflowCommand(withReferenceNode, {
        expectedRevision: withReferenceNode.revision,
        nodeId: "reference-1",
        patch: {
          image: {
            dataUrl: "invalid-data-url",
            filename: "reference.png",
            mediaType: "image/png",
            sizeBytes: 5,
          },
        },
        type: "update-node",
      })
    ).toThrowError("Reference image data URL is invalid.");

    expect(() =>
      applyWorkflowCommand(withReferenceNode, {
        expectedRevision: withReferenceNode.revision,
        nodeId: "reference-1",
        patch: {
          image: {
            dataUrl: "data:image/png;base64,SGVsbG8=",
            filename: "reference.png",
            mediaType: "image/png",
            sizeBytes: 4 * 1024 * 1024 + 1,
          },
        },
        type: "update-node",
      })
    ).toThrowError("Reference image exceeds the 4 MiB limit.");
  });
});

describe("image workflow engine run planning", () => {
  it("does not create a new revision for a duplicate connect command", () => {
    const graph = createDefaultWorkflowGraph();

    const connected = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      sourceNodeId: "generator-1",
      targetNodeId: "result-1",
      type: "connect-nodes",
    });

    expect(connected).toBe(graph);
    expect(connected.revision).toBe(0);
  });

  it("requires the generator-to-result edge and server-supplied image model", () => {
    const graphWithoutEdge = {
      ...createDefaultWorkflowGraph(),
      edges: [],
    };
    const withPrompt = applyWorkflowCommand(graphWithoutEdge, {
      expectedRevision: graphWithoutEdge.revision,
      nodeId: "generator-1",
      patch: {
        prompt: "A clean product shot",
      },
      type: "update-node",
    });

    expect(() =>
      buildWorkflowRunPlan(withPrompt, {
        imageModel: "google/gemini-3.1-flash-lite-image",
      })
    ).toThrowError(
      "Workflow must connect the image generator to the image result."
    );

    const readyGraph = applyWorkflowCommand(createDefaultWorkflowGraph(), {
      expectedRevision: 0,
      nodeId: "generator-1",
      patch: {
        prompt: "A clean product shot",
      },
      type: "update-node",
    });

    expect(
      buildWorkflowRunPlan(readyGraph, {
        imageModel: "custom/image-model",
      }).imageModel
    ).toBe("custom/image-model");
  });
});
