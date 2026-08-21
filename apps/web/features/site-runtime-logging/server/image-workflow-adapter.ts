import type { ImageWorkflowTelemetryObserver } from "@/features/image-workflow-agent/server/telemetry";
import { type RuntimeErrorEvent, runtimeErrorEvents } from "./events";
import type { RuntimeErrorContext } from "./logger";
import { runtimeErrorLogger } from "./server-logger";

interface RuntimeLogger {
  error(event: RuntimeErrorEvent, context: RuntimeErrorContext): string;
}

const eventByFailureCategory = {
  provider: runtimeErrorEvents.demoProviderFailed,
  runtime: runtimeErrorEvents.demoRuntimeFailed,
  tool: runtimeErrorEvents.demoToolFailed,
} as const;

export function createImageWorkflowRuntimeObserver(
  source: "agent" | "manual",
  logger: RuntimeLogger = runtimeErrorLogger
): ImageWorkflowTelemetryObserver {
  return {
    onFailure: (failure) => {
      logger.error(eventByFailureCategory[failure.failureCategory], {
        demo_slug: "image-workflow-agent",
        duration_ms: failure.durationMs,
        failure_category: failure.failureCategory,
        operation: failure.operation,
        retryable: failure.retryable,
        source,
      });
    },
  };
}
