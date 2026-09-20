import { APICallError, RetryError } from "ai";
import type { CanvasFailureObserver } from "@/features/canvas-agent/server/runner";
import { type RuntimeErrorEvent, runtimeErrorEvents } from "./events";
import type { RuntimeErrorContext } from "./logger";
import { runtimeErrorLogger } from "./server-logger";

export function createCanvasFailureObserver(
  source: "agent" | "manual",
  logger: {
    error(event: RuntimeErrorEvent, context: RuntimeErrorContext): string;
  } = runtimeErrorLogger
): CanvasFailureObserver {
  return (error, kind) => {
    const cause = RetryError.isInstance(error.cause)
      ? error.cause.lastError
      : error.cause;
    const category = kind === "gif" ? "tool" : "provider";
    logger.error(
      category === "tool"
        ? runtimeErrorEvents.demoToolFailed
        : runtimeErrorEvents.demoProviderFailed,
      {
        demo_slug: "canvas-agent",
        failure_category: category,
        operation: "workflow_run",
        retryable: APICallError.isInstance(cause) && cause.isRetryable,
        source,
      }
    );
  };
}
