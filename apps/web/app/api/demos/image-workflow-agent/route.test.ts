import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertValidWorkflowGraph: vi.fn(),
  generateResponse: vi.fn(),
  observerFailure: vi.fn(),
  validateUIMessages: vi.fn(async ({ messages }) => messages),
}));

vi.mock("ai", () => ({
  validateUIMessages: mocks.validateUIMessages,
}));
vi.mock("@/features/image-workflow-agent/model/workflow-validation", () => ({
  assertValidWorkflowGraph: mocks.assertValidWorkflowGraph,
}));
vi.mock("@/features/image-workflow-agent/server/chat", () => ({
  generateImageWorkflowAgentResponse: mocks.generateResponse,
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

import { ImageWorkflowObservedFailure } from "@/features/image-workflow-agent/server/telemetry";
import { POST } from "./route";

function callPost(request: Request) {
  return POST(request, undefined as never);
}

function createRequest(body: unknown) {
  return new Request("http://localhost/api/demos/image-workflow-agent", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

const validBody = {
  graph: { edges: [], nodes: [], revision: 0 },
  messages: [
    {
      id: "message-1",
      parts: [{ text: "Generate an image", type: "text" }],
      role: "user",
    },
  ],
};

describe("image workflow chat route telemetry boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns expected request validation as 400 without runtime logging", async () => {
    const response = await callPost(
      createRequest({ graph: { edges: [], nodes: [], revision: 0 } })
    );

    expect(response.status).toBe(400);
    expect(mocks.observerFailure).not.toHaveBeenCalled();
  });

  it("does not double-log a failure already observed by the chat runtime", async () => {
    mocks.generateResponse.mockRejectedValue(
      new ImageWorkflowObservedFailure("safe marker")
    );

    const response = await callPost(createRequest(validBody));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Image workflow chat failed." });
    expect(mocks.observerFailure).not.toHaveBeenCalled();
  });

  it("replaces streamed provider errors with a static public message", async () => {
    const privateProviderMessage =
      "private prompt token https://private.test should not escape";
    const toUIMessageStreamResponse = vi.fn(
      (options?: { onError?: (error: unknown) => string }) =>
        Response.json({
          errorText:
            options?.onError?.(new Error(privateProviderMessage)) ??
            privateProviderMessage,
        })
    );
    mocks.generateResponse.mockResolvedValue({ toUIMessageStreamResponse });

    const response = await callPost(createRequest(validBody));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ errorText: "Image workflow chat failed." });
    expect(JSON.stringify(payload)).not.toContain("private prompt");
    expect(JSON.stringify(payload)).not.toContain("private.test");
  });

  it("logs an unexpected route failure once without exposing its message", async () => {
    mocks.generateResponse.mockRejectedValue(
      new Error("private prompt token https://private.test")
    );

    const response = await callPost(createRequest(validBody));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Image workflow chat failed." });
    expect(JSON.stringify(payload)).not.toContain("private prompt");
    expect(mocks.observerFailure).toHaveBeenCalledOnce();
    expect(mocks.observerFailure).toHaveBeenCalledWith({
      durationMs: 0,
      failureCategory: "runtime",
      operation: "chat",
      retryable: false,
    });
  });
});
