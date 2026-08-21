import { describe, expect, it, vi } from "vitest";

vi.mock("./server-logger", () => ({
  runtimeErrorLogger: { error: vi.fn() },
}));

import { reportDemoRouteFailure } from "./demo-route-adapter";
import { runtimeErrorEvents } from "./events";

describe("demo route runtime error adapter", () => {
  it("classifies provider-backed actions without passing failure payloads", () => {
    const error = vi.fn(() => "error-id");

    reportDemoRouteFailure(
      { action: "send_message", demoSlug: "minimal-chat-agent" },
      { error }
    );

    expect(error).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(runtimeErrorEvents.demoProviderFailed, {
      demo_slug: "minimal-chat-agent",
      failure_category: "provider",
      operation: "chat",
      retryable: false,
    });
  });

  it("classifies storage mutations at the final route boundary", () => {
    const error = vi.fn(() => "error-id");

    reportDemoRouteFailure(
      { action: "compact_context", demoSlug: "customer-memory-agent" },
      { error }
    );

    expect(error).toHaveBeenCalledWith(runtimeErrorEvents.demoStorageFailed, {
      demo_slug: "customer-memory-agent",
      failure_category: "storage",
      operation: "context_compaction",
      retryable: false,
    });
  });

  it("drops unknown demo and action values", () => {
    const error = vi.fn(() => "error-id");

    reportDemoRouteFailure(
      { action: "send_message", demoSlug: "private-demo" },
      { error }
    );
    reportDemoRouteFailure(
      { action: "clicked_anything", demoSlug: "foundation-chat" },
      { error }
    );

    expect(error).not.toHaveBeenCalled();
  });
});
