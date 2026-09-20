import { APICallError } from "ai";
import { expect, it, vi } from "vitest";
import { CanvasNodeError } from "@/features/canvas-agent/server/runner";
import { ResourceUsageDeniedError } from "@/features/shared/resource-usage/server/context";

vi.mock("./server-logger", () => ({ runtimeErrorLogger: { error: vi.fn() } }));

import { createCanvasFailureObserver } from "./canvas-adapter";
import { runtimeErrorEventCatalog } from "./events";
import { createRuntimeErrorLogger } from "./logger";

it.each([
  "agent",
  "manual",
] as const)("logs a bounded node failure for %s without leaking its cause", (source) => {
  const sink = vi.fn();
  const logger = createRuntimeErrorLogger({
    createId: () => "error-1",
    deployment: () => ({ deployment_environment: "development" }),
    events: runtimeErrorEventCatalog,
    now: () => new Date(0),
    service: "test",
    sink,
  });
  const cause = new APICallError({
    message: "private-provider-detail",
    url: "https://example.com/private",
    requestBodyValues: { prompt: "private-prompt" },
    statusCode: 429,
    isRetryable: true,
  });
  createCanvasFailureObserver(source, logger)(
    new CanvasNodeError("visual", "生成失败", { cause }),
    "image"
  );
  expect(sink).toHaveBeenCalledOnce();
  const record = sink.mock.calls[0]?.[0];
  expect(JSON.parse(record)).toMatchObject({
    event: "demo.provider_failed",
    demo_slug: "canvas-agent",
    failure_category: "provider",
    retryable: true,
    source,
  });
  expect(record).not.toContain("private");
});

it("does not report an expected credit denial as a provider failure", () => {
  const logger = { error: vi.fn() };
  createCanvasFailureObserver("agent", logger)(
    new CanvasNodeError("image", "额度不足", {
      cause: new ResourceUsageDeniedError("额度不足"),
    }),
    "image"
  );
  expect(logger.error).not.toHaveBeenCalled();
});
