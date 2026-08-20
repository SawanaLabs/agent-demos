import { describe, expect, it, vi } from "vitest";

import {
  applyWorkflowCommand,
  createDefaultWorkflowGraph,
} from "../model/workflow-engine";
import { ImageWorkflowExecutionError } from "./image-executor";
import { executeImageWorkflowGraph } from "./runtime";

function createRunnableGraph() {
  const graph = createDefaultWorkflowGraph();

  return applyWorkflowCommand(graph, {
    expectedRevision: graph.revision,
    nodeId: "generator-1",
    patch: { prompt: "A restrained editorial poster" },
    type: "update-node",
  });
}

describe("image workflow runtime", () => {
  it("owns lifecycle transitions and retries one network failure", async () => {
    const executePlan = vi
      .fn()
      .mockRejectedValueOnce(
        new ImageWorkflowExecutionError("network", "Temporary network failure.")
      )
      .mockResolvedValueOnce({
        dataUrl: "data:image/png;base64,c3VjY2Vzcw==",
        mediaType: "image/png",
      });

    const graph = await executeImageWorkflowGraph(
      createRunnableGraph(),
      { AI_GATEWAY_API_KEY: "test-key" },
      { executePlan, randomUUID: () => "run-1" }
    );
    const result = graph.nodes.find((node) => node.kind === "image-result");

    expect(executePlan).toHaveBeenCalledTimes(2);
    expect(graph.revision).toBe(3);
    expect(result?.data).toMatchObject({
      activeRunId: null,
      image: {
        dataUrl: "data:image/png;base64,c3VjY2Vzcw==",
        mediaType: "image/png",
      },
      status: "succeeded",
    });
  });

  it("reports a final provider failure once without forwarding the error", async () => {
    const onFailure = vi.fn();
    const now = vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1450);
    const graph = await executeImageWorkflowGraph(
      createRunnableGraph(),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        executePlan: vi
          .fn()
          .mockRejectedValue(
            new ImageWorkflowExecutionError(
              "provider",
              "Private provider response."
            )
          ),
        now,
        observer: { onFailure },
        randomUUID: () => "run-1",
      }
    );
    const result = graph.nodes.find((node) => node.kind === "image-result");

    expect(onFailure).toHaveBeenCalledOnce();
    expect(onFailure).toHaveBeenCalledWith({
      durationMs: 450,
      failureCategory: "provider",
      operation: "workflow_run",
      retryable: false,
    });
    expect(JSON.stringify(onFailure.mock.calls)).not.toContain(
      "Private provider response."
    );
    expect(graph.revision).toBe(3);
    expect(result?.data).toMatchObject({
      activeRunId: null,
      errorMessage: "Image generation provider request failed.",
      image: null,
      status: "failed",
    });
    expect(JSON.stringify(graph)).not.toContain("Private provider response.");
  });
});
