import { describe, expect, it } from "vitest";

import {
  applyWorkflowCommand,
  buildWorkflowRunPlan,
  createDefaultWorkflowGraph,
} from "./workflow-engine";

describe("image workflow engine", () => {
  it("builds a runnable text-to-image plan after the generator prompt changes", () => {
    const graph = createDefaultWorkflowGraph();
    const updated = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      nodeId: "generator-1",
      patch: {
        prompt: "A restrained editorial poster for a summer design exhibition",
      },
      type: "update-node",
    });

    expect(
      buildWorkflowRunPlan(updated, {
        imageModel: "google/gemini-3.1-flash-lite-image",
      })
    ).toEqual({
      aspectRatio: "1:1",
      imageModel: "google/gemini-3.1-flash-lite-image",
      prompt: "A restrained editorial poster for a summer design exhibition",
      referenceImage: null,
      resultNodeId: "result-1",
      revision: 1,
    });
  });

  it("rejects a stale revision before mutating the workflow graph", () => {
    const graph = createDefaultWorkflowGraph();

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision + 1,
        nodeId: "generator-1",
        patch: {
          prompt: "A stale prompt",
        },
        type: "update-node",
      })
    ).toThrowError("Workflow revision mismatch.");
  });

  it("builds a runnable image-edit plan when one reference image is connected", () => {
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
    const withReferenceImage = applyWorkflowCommand(withReferenceNode, {
      expectedRevision: withReferenceNode.revision,
      nodeId: "reference-1",
      patch: {
        image: {
          dataUrl: "data:image/png;base64,cmVm",
          filename: "reference.png",
          mediaType: "image/png",
          sizeBytes: 2048,
        },
      },
      type: "update-node",
    });
    const withPrompt = applyWorkflowCommand(withReferenceImage, {
      expectedRevision: withReferenceImage.revision,
      nodeId: "generator-1",
      patch: {
        prompt: "Turn this product photo into a restrained editorial campaign",
      },
      type: "update-node",
    });
    const connected = applyWorkflowCommand(withPrompt, {
      expectedRevision: withPrompt.revision,
      sourceNodeId: "reference-1",
      targetNodeId: "generator-1",
      type: "connect-nodes",
    });

    expect(
      buildWorkflowRunPlan(connected, {
        imageModel: "google/gemini-3.1-flash-lite-image",
      })
    ).toEqual({
      aspectRatio: "1:1",
      imageModel: "google/gemini-3.1-flash-lite-image",
      prompt: "Turn this product photo into a restrained editorial campaign",
      referenceImage: {
        dataUrl: "data:image/png;base64,cmVm",
        filename: "reference.png",
        mediaType: "image/png",
        sizeBytes: 2048,
      },
      resultNodeId: "result-1",
      revision: 4,
    });
  });

  it("rejects invalid workflow connections outside the supported chain", () => {
    const graph = createDefaultWorkflowGraph();

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        sourceNodeId: "result-1",
        targetNodeId: "generator-1",
        type: "connect-nodes",
      })
    ).toThrowError("Invalid workflow connection.");
  });

  it("rejects commands that reference unknown nodes", () => {
    const graph = createDefaultWorkflowGraph();

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        nodeId: "missing-node",
        patch: {
          prompt: "test",
        },
        type: "update-node",
      })
    ).toThrowError('Workflow node "missing-node" does not exist.');

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        nodeId: "missing-node",
        position: {
          x: 1,
          y: 2,
        },
        type: "move-node",
      })
    ).toThrowError('Workflow node "missing-node" does not exist.');
  });

  it("rejects invalid patches for the target node kind", () => {
    const graph = createDefaultWorkflowGraph();

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        nodeId: "generator-1",
        patch: {
          status: "running",
        },
        type: "update-node",
      })
    ).toThrowError('Workflow patch is invalid for node "generator-1".');

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        nodeId: "generator-1",
        patch: {
          prompt: null,
        },
        type: "update-node",
      })
    ).toThrowError('Workflow patch is invalid for node "generator-1".');
  });
});

describe("image workflow engine node constraints", () => {
  it("rejects duplicate generator, result, and reference nodes", () => {
    const graph = createDefaultWorkflowGraph();

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        node: {
          data: {
            aspectRatio: "1:1",
            prompt: "",
          },
          id: "generator-2",
          kind: "image-generator",
          position: {
            x: 0,
            y: 0,
          },
        },
        type: "add-node",
      })
    ).toThrowError("Only one image generator node is allowed.");

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        node: {
          data: {
            activeRunId: null,
            errorMessage: null,
            image: null,
            prompt: null,
            status: "idle",
          },
          id: "result-2",
          kind: "image-result",
          position: {
            x: 0,
            y: 0,
          },
        },
        type: "add-node",
      })
    ).toThrowError("Only one image result node is allowed.");

    const withReference = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      node: {
        data: {
          image: null,
          label: "Reference image",
        },
        id: "reference-1",
        kind: "reference-image",
        position: {
          x: 0,
          y: 0,
        },
      },
      type: "add-node",
    });

    expect(() =>
      applyWorkflowCommand(withReference, {
        expectedRevision: withReference.revision,
        node: {
          data: {
            image: null,
            label: "Reference image 2",
          },
          id: "reference-2",
          kind: "reference-image",
          position: {
            x: 0,
            y: 0,
          },
        },
        type: "add-node",
      })
    ).toThrowError("Only one reference image node is allowed.");
  });
});
