export interface RuntimeDeploymentContext {
  readonly deployment_environment: string;
  readonly deployment_host?: string;
  readonly deployment_ref?: string;
}

export interface RuntimeErrorContext {
  readonly client_error_kind?:
    | "global_error"
    | "route_error"
    | "unhandled_rejection"
    | "window_error";
  readonly demo_slug?: "image-workflow-agent";
  readonly duration_ms?: number;
  readonly failure_category: "provider" | "runtime" | "storage" | "tool";
  readonly operation:
    | "chat"
    | "client_render"
    | "storage_read"
    | "storage_write"
    | "tool_call"
    | "workflow_run";
  readonly retryable?: boolean;
  readonly source?:
    | "agent"
    | "app_error_boundary"
    | "app_global_error_boundary"
    | "manual";
}

interface RuntimeErrorLoggerOptions<Events extends readonly string[]> {
  readonly createId: () => string;
  readonly deployment: () => RuntimeDeploymentContext;
  readonly events: Events;
  readonly now: () => Date;
  readonly service: string;
  readonly sink: (record: string) => void;
}

const labelPattern = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/u;
const allowedDemoSlugs = new Set(["image-workflow-agent"]);
const errorIdPattern = /^[A-Za-z0-9_-]{1,64}$/u;
const deploymentEnvironmentPattern = /^[a-z][a-z0-9-]{0,63}$/u;
const deploymentRefPattern = /^[A-Za-z0-9._/-]{1,128}$/u;
const maximumDurationMs = 86_400_000;
const allowedFailureCategories = new Set([
  "provider",
  "runtime",
  "storage",
  "tool",
]);
const allowedOperations = new Set([
  "chat",
  "client_render",
  "storage_read",
  "storage_write",
  "tool_call",
  "workflow_run",
]);
const allowedSources = new Set([
  "agent",
  "app_error_boundary",
  "app_global_error_boundary",
  "manual",
]);
const allowedClientErrorKinds = new Set([
  "global_error",
  "route_error",
  "unhandled_rejection",
  "window_error",
]);

function requireLabel(value: string, name: string): string {
  if (value.length > 128 || !labelPattern.test(value)) {
    throw new Error(`${name} must use lowercase dot-separated identifiers.`);
  }

  return value;
}

function safeDeployment(
  resolve: () => RuntimeDeploymentContext
): RuntimeDeploymentContext {
  try {
    const deployment = resolve();
    const environment = deploymentEnvironmentPattern.test(
      deployment.deployment_environment
    )
      ? deployment.deployment_environment
      : "unknown";
    const context: {
      deployment_environment: string;
      deployment_host?: string;
      deployment_ref?: string;
    } = {
      deployment_environment: environment,
    };

    if (
      deployment.deployment_ref &&
      deploymentRefPattern.test(deployment.deployment_ref)
    ) {
      context.deployment_ref = deployment.deployment_ref.slice(0, 128);
    }

    if (
      deployment.deployment_host &&
      /^[a-z0-9.-]{1,253}$/u.test(deployment.deployment_host)
    ) {
      context.deployment_host = deployment.deployment_host;
    }

    return context;
  } catch {
    return { deployment_environment: "unknown" };
  }
}

function safeContext(input: Readonly<Record<string, unknown>>) {
  const context: Record<string, boolean | number | string> = {};

  if (
    typeof input.client_error_kind === "string" &&
    allowedClientErrorKinds.has(input.client_error_kind)
  ) {
    context.client_error_kind = input.client_error_kind;
  }

  if (
    typeof input.demo_slug === "string" &&
    allowedDemoSlugs.has(input.demo_slug)
  ) {
    context.demo_slug = input.demo_slug;
  }

  if (
    typeof input.duration_ms === "number" &&
    Number.isFinite(input.duration_ms) &&
    input.duration_ms >= 0 &&
    input.duration_ms <= maximumDurationMs
  ) {
    context.duration_ms = Math.round(input.duration_ms);
  }

  if (
    typeof input.failure_category === "string" &&
    allowedFailureCategories.has(input.failure_category)
  ) {
    context.failure_category = input.failure_category;
  }

  if (
    typeof input.operation === "string" &&
    allowedOperations.has(input.operation)
  ) {
    context.operation = input.operation;
  }

  if (typeof input.retryable === "boolean") {
    context.retryable = input.retryable;
  }

  if (typeof input.source === "string" && allowedSources.has(input.source)) {
    context.source = input.source;
  }

  return context;
}

export function createRuntimeErrorLogger<
  const Events extends readonly string[],
>(options: RuntimeErrorLoggerOptions<Events>) {
  const service = requireLabel(options.service, "Logging service");
  const allowedEvents = new Set<string>();

  for (const event of options.events) {
    allowedEvents.add(requireLabel(event, "Logging event"));
  }

  return {
    error(event: Events[number], context: RuntimeErrorContext): string {
      let errorId = "unavailable";

      if (!allowedEvents.has(event)) {
        return errorId;
      }

      try {
        const deployment = safeDeployment(options.deployment);
        const generatedErrorId = options.createId();
        errorId = errorIdPattern.test(generatedErrorId)
          ? generatedErrorId
          : "unavailable";
        const record = {
          ...safeContext(
            context as unknown as Readonly<Record<string, unknown>>
          ),
          ...deployment,
          error_id: errorId,
          event,
          level: "error" as const,
          service,
          timestamp: options.now().toISOString(),
        };

        options.sink(JSON.stringify(record));
      } catch {
        // Runtime logging must never replace the product failure being reported.
      }

      return errorId;
    },
  };
}
