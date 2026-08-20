import { describe, expect, it, vi } from "vitest";

import { runtimeErrorEventCatalog, runtimeErrorEvents } from "./events";
import { createRuntimeErrorLogger } from "./logger";

describe("production runtime error logger", () => {
  it("writes one allowlisted JSON record without raw errors or user content", () => {
    const sink = vi.fn();
    const logger = createRuntimeErrorLogger({
      createId: () => "error-123",
      deployment: () => ({
        deployment_environment: "preview",
        deployment_ref: "hermes",
      }),
      events: runtimeErrorEventCatalog,
      now: () => new Date("2026-08-17T00:00:00.000Z"),
      service: "agent_demos_web",
      sink,
    });

    const errorId = logger.error(runtimeErrorEvents.demoProviderFailed, {
      demo_slug: "image-workflow-agent",
      duration_ms: 1250,
      failure_category: "provider",
      operation: "workflow_run",
      prompt: "draw my private launch plan",
      retryable: false,
      source: "manual",
      token: "secret-token",
    } as never);

    expect(errorId).toBe("error-123");
    expect(sink).toHaveBeenCalledOnce();

    const record = JSON.parse(sink.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;

    expect(record).toEqual({
      demo_slug: "image-workflow-agent",
      deployment_environment: "preview",
      deployment_ref: "hermes",
      duration_ms: 1250,
      error_id: "error-123",
      event: "demo.provider_failed",
      failure_category: "provider",
      level: "error",
      operation: "workflow_run",
      retryable: false,
      service: "agent_demos_web",
      source: "manual",
      timestamp: "2026-08-17T00:00:00.000Z",
    });
    expect(sink.mock.calls[0]?.[0]).not.toMatch(
      /private launch plan|secret-token|prompt|token|error_message|stack/u
    );
  });

  it("normalizes unsafe runtime values instead of serializing them", () => {
    const sink = vi.fn();
    const logger = createRuntimeErrorLogger({
      createId: () => "error-456",
      deployment: () => ({ deployment_environment: "production" }),
      events: runtimeErrorEventCatalog,
      now: () => new Date("2026-08-17T00:00:00.000Z"),
      service: "agent_demos_web",
      sink,
    });

    logger.error(runtimeErrorEvents.demoRuntimeFailed, {
      demo_slug: "private-user-value",
      duration_ms: Number.MAX_SAFE_INTEGER,
      failure_category: "made-up",
      operation: "prompt: private text",
      retryable: "sometimes",
      source: "visitor-123",
    } as never);

    const record = JSON.parse(sink.mock.calls[0]?.[0] as string) as Record<
      string,
      unknown
    >;

    expect(record).not.toHaveProperty("demo_slug");
    expect(record).not.toHaveProperty("duration_ms");
    expect(record).not.toHaveProperty("failure_category");
    expect(record).not.toHaveProperty("operation");
    expect(record).not.toHaveProperty("retryable");
    expect(record).not.toHaveProperty("source");
  });

  it("drops runtime event names outside the finite catalog", () => {
    const sink = vi.fn();
    const logger = createRuntimeErrorLogger({
      createId: () => "error-private",
      deployment: () => ({ deployment_environment: "production" }),
      events: runtimeErrorEventCatalog,
      now: () => new Date("2026-08-17T00:00:00.000Z"),
      service: "agent_demos_web",
      sink,
    });

    expect(
      logger.error("visitor.private_event" as never, {
        failure_category: "runtime",
        operation: "workflow_run",
      })
    ).toBe("unavailable");
    expect(sink).not.toHaveBeenCalled();
  });

  it("preserves the product failure when deployment detection or the sink fails", () => {
    const logger = createRuntimeErrorLogger({
      createId: () => "error-789",
      deployment: () => {
        throw new Error("metadata unavailable");
      },
      events: runtimeErrorEventCatalog,
      now: () => new Date("2026-08-17T00:00:00.000Z"),
      service: "agent_demos_web",
      sink: () => {
        throw new Error("stderr unavailable");
      },
    });

    expect(() =>
      logger.error(runtimeErrorEvents.demoToolFailed, {
        failure_category: "tool",
        operation: "tool_call",
      })
    ).not.toThrow();
  });
});

describe("production runtime error logger hardening", () => {
  it("preserves the product failure when identifier generation fails", () => {
    const logger = createRuntimeErrorLogger({
      createId: () => {
        throw new Error("uuid unavailable");
      },
      deployment: () => ({ deployment_environment: "production" }),
      events: runtimeErrorEventCatalog,
      now: () => new Date("2026-08-17T00:00:00.000Z"),
      service: "agent_demos_web",
      sink: vi.fn(),
    });

    expect(() =>
      logger.error(runtimeErrorEvents.demoRuntimeFailed, {
        failure_category: "runtime",
        operation: "workflow_run",
      })
    ).not.toThrow();
  });

  it("drops an unsafe generated identifier before serialization", () => {
    const sink = vi.fn();
    const logger = createRuntimeErrorLogger({
      createId: () => "private@example.com token=secret-token",
      deployment: () => ({ deployment_environment: "production" }),
      events: runtimeErrorEventCatalog,
      now: () => new Date("2026-08-17T00:00:00.000Z"),
      service: "agent_demos_web",
      sink,
    });

    expect(
      logger.error(runtimeErrorEvents.demoRuntimeFailed, {
        failure_category: "runtime",
        operation: "workflow_run",
      })
    ).toBe("unavailable");
    expect(sink.mock.calls[0]?.[0]).not.toMatch(
      /private@example\.com|secret-token/u
    );
    expect(JSON.parse(sink.mock.calls[0]?.[0] as string)).toHaveProperty(
      "error_id",
      "unavailable"
    );
  });

  it("fails fast for invalid logger labels", () => {
    expect(() =>
      createRuntimeErrorLogger({
        createId: () => "id",
        deployment: () => ({ deployment_environment: "production" }),
        events: ["Demo Failed"] as const,
        now: () => new Date(),
        service: "Agent Demos Web",
        sink: vi.fn(),
      })
    ).toThrow(/lowercase/u);
    expect(() =>
      createRuntimeErrorLogger({
        createId: () => "id",
        deployment: () => ({ deployment_environment: "production" }),
        events: ["a".repeat(129)] as readonly [string],
        now: () => new Date(),
        service: "agent_demos_web",
        sink: vi.fn(),
      })
    ).toThrow(/lowercase/u);
  });
});
