import { describe, expect, it, vi } from "vitest";

vi.mock("./server-logger", () => ({
  runtimeErrorLogger: { error: vi.fn() },
}));

import { runtimeErrorEvents } from "./events";
import { createImageWorkflowRuntimeObserver } from "./image-workflow-adapter";

describe("host image workflow runtime logging adapter", () => {
  it("maps a portable failure into one bounded runtime record", () => {
    const error = vi.fn(() => "error-1");
    const observer = createImageWorkflowRuntimeObserver("agent", { error });

    observer.onFailure({
      durationMs: 320,
      failureCategory: "provider",
      operation: "workflow_run",
      retryable: true,
    });

    expect(error).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(runtimeErrorEvents.demoProviderFailed, {
      demo_slug: "image-workflow-agent",
      duration_ms: 320,
      failure_category: "provider",
      operation: "workflow_run",
      retryable: true,
      source: "agent",
    });
  });
});
