import { describe, expect, it } from "vitest";

import {
  applyWorkflowCommand,
  createDefaultWorkflowGraph,
  type WorkflowGraph,
} from "./workflow-engine";
import { assertValidWorkflowGraph } from "./workflow-validation";

describe("image workflow engine", () => {
  it("applies pure run lifecycle transitions with revision checks", () => {
    const withPrompt = applyWorkflowCommand(createDefaultWorkflowGraph(), {
      expectedRevision: 0,
      nodeId: "generator-1",
      patch: {
        prompt: "A minimal campaign still life",
      },
      type: "update-node",
    });

    const started = applyWorkflowCommand(withPrompt, {
      expectedRevision: withPrompt.revision,
      nodeId: "result-1",
      runId: "run-1",
      type: "run-start",
    });
    const resultNodeAfterStart = started.nodes.find(
      (node) => node.id === "result-1"
    );

    expect(resultNodeAfterStart).toMatchObject({
      data: {
        errorMessage: null,
        image: null,
        prompt: "A minimal campaign still life",
        status: "running",
      },
    });

    const succeeded = applyWorkflowCommand(started, {
      expectedRevision: started.revision,
      image: {
        dataUrl: "data:image/png;base64,c3VjY2Vzcw==",
        mediaType: "image/png",
      },
      nodeId: "result-1",
      runId: "run-1",
      type: "run-success",
    });

    expect(
      succeeded.nodes.find((node) => node.id === "result-1")
    ).toMatchObject({
      data: {
        errorMessage: null,
        image: {
          dataUrl: "data:image/png;base64,c3VjY2Vzcw==",
          mediaType: "image/png",
        },
        prompt: "A minimal campaign still life",
        status: "succeeded",
      },
    });

    const failed = applyWorkflowCommand(started, {
      errorMessage: "Provider returned no image output.",
      expectedRevision: started.revision,
      nodeId: "result-1",
      runId: "run-1",
      type: "run-failure",
    });

    expect(failed.nodes.find((node) => node.id === "result-1")).toMatchObject({
      data: {
        errorMessage: "Provider returned no image output.",
        image: null,
        prompt: "A minimal campaign still life",
        status: "failed",
      },
    });
  });

  it("protects the run lock from concurrent or stale transitions", () => {
    const withPrompt = applyWorkflowCommand(createDefaultWorkflowGraph(), {
      expectedRevision: 0,
      nodeId: "generator-1",
      patch: {
        prompt: "A minimal campaign still life",
      },
      type: "update-node",
    });
    const started = applyWorkflowCommand(withPrompt, {
      expectedRevision: withPrompt.revision,
      nodeId: "result-1",
      runId: "run-1",
      type: "run-start",
    });

    expect(() =>
      applyWorkflowCommand(started, {
        expectedRevision: started.revision,
        nodeId: "result-1",
        runId: "run-2",
        type: "run-start",
      })
    ).toThrowError('Workflow result node "result-1" is already running.');

    expect(() =>
      applyWorkflowCommand(started, {
        errorMessage: "wrong run",
        expectedRevision: started.revision,
        nodeId: "result-1",
        runId: "run-2",
        type: "run-failure",
      })
    ).toThrowError('Workflow run "run-2" does not own result node "result-1".');
  });

  it("rejects graph edits while a workflow run owns the result node", () => {
    const withPrompt = applyWorkflowCommand(createDefaultWorkflowGraph(), {
      expectedRevision: 0,
      nodeId: "generator-1",
      patch: { prompt: "A minimal campaign still life" },
      type: "update-node",
    });
    const started = applyWorkflowCommand(withPrompt, {
      expectedRevision: withPrompt.revision,
      nodeId: "result-1",
      runId: "run-1",
      type: "run-start",
    });

    expect(() =>
      applyWorkflowCommand(started, {
        expectedRevision: started.revision,
        nodeId: "generator-1",
        patch: { prompt: "A conflicting edit" },
        type: "update-node",
      })
    ).toThrowError("Workflow is locked while an image run is active.");
  });
});

describe("image workflow engine request boundary", () => {
  it("keeps result lifecycle fields internal to run commands", () => {
    const graph = createDefaultWorkflowGraph();

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        nodeId: "result-1",
        patch: {
          activeRunId: "spoofed-run",
          status: "succeeded",
        },
        type: "update-node",
      })
    ).toThrowError('Workflow patch is invalid for node "result-1".');
  });

  it("rejects malformed or in-flight workflow graphs at the request boundary", () => {
    const graph = createDefaultWorkflowGraph();
    const malformedGenerator = {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.kind === "image-generator"
          ? {
              ...node,
              data: {
                ...node.data,
                prompt: null,
              },
            }
          : node
      ),
    } as unknown as WorkflowGraph;

    expect(() => assertValidWorkflowGraph(malformedGenerator)).toThrowError(
      "Workflow graph node data is invalid."
    );

    const spoofedRunningResult = {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.kind === "image-result"
          ? {
              ...node,
              data: {
                ...node.data,
                activeRunId: "client-run",
                status: "running" as const,
              },
            }
          : node
      ),
    };

    expect(() => assertValidWorkflowGraph(spoofedRunningResult)).toThrowError(
      "Workflow graph result state is invalid."
    );
  });

  it("rejects replacement workflows that fabricate result lifecycle state", () => {
    const graph = createDefaultWorkflowGraph();
    const spoofedResultGraph = {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.kind === "image-result"
          ? {
              ...node,
              data: {
                activeRunId: null,
                errorMessage: null,
                image: {
                  dataUrl: "data:image/png;base64,c3Bvb2ZlZA==",
                  mediaType: "image/png",
                },
                prompt: "Spoofed prompt",
                status: "succeeded" as const,
              },
            }
          : node
      ),
    };

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        graph: spoofedResultGraph,
        type: "replace-workflow",
      })
    ).toThrowError("Replacement workflow result must be idle.");
  });

  it("rejects hidden oversized image payloads and unsupported replacement nodes", () => {
    const graph = createDefaultWorkflowGraph();
    const withReference = applyWorkflowCommand(graph, {
      expectedRevision: graph.revision,
      node: {
        data: { image: null, label: "Reference image" },
        id: "reference-1",
        kind: "reference-image",
        position: { x: 0, y: 0 },
      },
      type: "add-node",
    });
    const oversizedDataUrl = `data:image/png;base64,${"A".repeat(5_592_408)}`;

    expect(() =>
      applyWorkflowCommand(withReference, {
        expectedRevision: withReference.revision,
        nodeId: "reference-1",
        patch: {
          image: {
            dataUrl: oversizedDataUrl,
            filename: "oversized.png",
            mediaType: "image/png",
            sizeBytes: 1,
          },
        },
        type: "update-node",
      })
    ).toThrowError("Reference image exceeds the 4 MiB limit.");

    const graphWithUnknownNode = {
      ...graph,
      nodes: [
        ...graph.nodes,
        {
          data: {},
          id: "unknown-1",
          kind: "unknown",
          position: { x: 0, y: 0 },
        },
      ],
    } as unknown as WorkflowGraph;

    expect(() =>
      applyWorkflowCommand(graph, {
        expectedRevision: graph.revision,
        graph: graphWithUnknownNode,
        type: "replace-workflow",
      })
    ).toThrowError("Workflow graph shape is invalid.");
  });
});
