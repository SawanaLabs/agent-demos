import {
  type CatalogDemoAction,
  isCatalogDemoAction,
} from "@/features/site-analytics/shared/demo-action-contract";
import { type RuntimeErrorEvent, runtimeErrorEvents } from "./events";
import type { RuntimeErrorContext } from "./logger";
import { runtimeErrorLogger } from "./server-logger";

interface RuntimeLogger {
  error(event: RuntimeErrorEvent, context: RuntimeErrorContext): string;
}

const storageActions = new Set(["compact_context", "edit_message"]);

function operationForAction(action: string): RuntimeErrorContext["operation"] {
  if (action === "compact_context") {
    return "context_compaction";
  }

  if (action === "edit_message") {
    return "message_edit";
  }

  if (action === "evaluate") {
    return "evaluation";
  }

  if (action === "generate_object") {
    return "object_generation";
  }

  return "chat";
}

export function reportDemoRouteFailure(
  input: {
    readonly action: unknown;
    readonly demoSlug: unknown;
  },
  logger: RuntimeLogger = runtimeErrorLogger
): void {
  if (!isCatalogDemoAction(input.demoSlug, input.action)) {
    return;
  }

  const action = input.action as CatalogDemoAction;
  const failureCategory = storageActions.has(action) ? "storage" : "provider";
  const event =
    failureCategory === "storage"
      ? runtimeErrorEvents.demoStorageFailed
      : runtimeErrorEvents.demoProviderFailed;

  logger.error(event, {
    demo_slug: input.demoSlug,
    failure_category: failureCategory,
    operation: operationForAction(action),
    retryable: false,
  });
}
