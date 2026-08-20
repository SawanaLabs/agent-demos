import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertValidWorkflowGraph: vi.fn(),
  executeGraph: vi.fn(),
  getRunnableWorkflowState: vi.fn(() => ({ referenceImage: null })),
  observerFailure: vi.fn(),
}));

vi.mock("@/features/image-workflow-agent/model/workflow-validation", () => ({
  assertValidWorkflowGraph: mocks.assertValidWorkflowGraph,
  getRunnableWorkflowState: mocks.getRunnableWorkflowState,
}));
vi.mock("@/features/image-workflow-agent/server/runtime", () => ({
  executeImageWorkflowGraph: mocks.executeGraph,
}));
vi.mock("@/features/image-workflow-agent/server/env", () => ({
  getImageWorkflowAgentSetupState: () => ({
    config: { chatModel: "chat-model", imageModel: "image-model" },
    isReady: true,
    issues: [],
  }),
}));
vi.mock(
  "@/features/site-runtime-logging/server/image-workflow-adapter",
  () => ({
    createImageWorkflowRuntimeObserver: () => ({
      onFailure: mocks.observerFailure,
    }),
  })
);
vi.mock("@/features/site-usage-gate/server/metered-demo-route", () => ({
  createMeteredDemoRoute:
    ({
      handler,
    }: {
      handler: (input: { request: Request }) => Promise<Response>;
    }) =>
    (request: Request) =>
      handler({ request }),
}));

import { POST } from "./route";

function callPost(request: Request) {
  return POST(request, undefined as never);
}

function createRequest(graph: unknown) {
  return new Request("http://localhost/api/demos/image-workflow-agent/run", {
    body: JSON.stringify({ graph }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

const graph = { edges: [], nodes: [], revision: 0 };

describe("image workflow manual run route telemetry boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRunnableWorkflowState.mockReturnValue({ referenceImage: null });
  });

  it("returns expected runnable validation as 400 without runtime logging", async () => {
    mocks.getRunnableWorkflowState.mockImplementation(() => {
      throw new Error("Image generator prompt is required.");
    });

    const response = await callPost(createRequest(graph));

    expect(response.status).toBe(400);
    expect(mocks.executeGraph).not.toHaveBeenCalled();
    expect(mocks.observerFailure).not.toHaveBeenCalled();
  });

  it("logs an unexpected runtime failure once and returns a static error", async () => {
    mocks.executeGraph.mockRejectedValue(
      new Error("private prompt token https://private.test")
    );

    const response = await callPost(createRequest(graph));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Workflow run failed." });
    expect(JSON.stringify(payload)).not.toContain("private prompt");
    expect(mocks.observerFailure).toHaveBeenCalledOnce();
    expect(mocks.observerFailure).toHaveBeenCalledWith({
      durationMs: 0,
      failureCategory: "runtime",
      operation: "workflow_run",
      retryable: false,
    });
  });

  it("returns an accepted failed graph without adding a duplicate route log", async () => {
    const failedGraph = { ...graph, revision: 2 };
    mocks.executeGraph.mockResolvedValue(failedGraph);

    const response = await callPost(createRequest(graph));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ graph: failedGraph });
    expect(mocks.observerFailure).not.toHaveBeenCalled();
  });
});
