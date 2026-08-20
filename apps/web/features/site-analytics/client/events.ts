export const demoActionCatalog = {
  "image-workflow-agent": ["modify_workflow", "run_workflow", "send_message"],
} as const;

export type DemoActionSource = "agent" | "manual";

type ImageWorkflowAgentAction =
  | {
      readonly action: "modify_workflow";
      readonly demo_slug: "image-workflow-agent";
      readonly source?: DemoActionSource;
    }
  | {
      readonly action: "run_workflow";
      readonly demo_slug: "image-workflow-agent";
      readonly has_reference_image: boolean;
      readonly source?: DemoActionSource;
    }
  | {
      readonly action: "send_message";
      readonly demo_slug: "image-workflow-agent";
      readonly source?: DemoActionSource;
    };

export type DemoActionEvent = ImageWorkflowAgentAction;

export type DemoActionProvider = (
  eventName: "demo_action",
  parameters: DemoActionEvent
) => void;

const allowedSources = new Set<DemoActionSource>(["agent", "manual"]);

function isDemoActionSource(value: unknown): value is DemoActionSource {
  return (
    typeof value === "string" && allowedSources.has(value as DemoActionSource)
  );
}

function normalizeOptionalSource(
  value: unknown
): DemoActionSource | null | undefined {
  if (value === undefined) {
    return;
  }

  return isDemoActionSource(value) ? value : null;
}

function normalizeDemoAction(input: DemoActionEvent): DemoActionEvent | null {
  const event = input as unknown as Readonly<Record<string, unknown>>;

  if (event.demo_slug !== "image-workflow-agent") {
    return null;
  }

  const source = normalizeOptionalSource(event.source);

  if (source === null) {
    return null;
  }

  if (event.action === "send_message") {
    return {
      action: "send_message",
      demo_slug: "image-workflow-agent",
      ...(source === undefined ? {} : { source }),
    };
  }

  if (event.action === "modify_workflow") {
    return {
      action: "modify_workflow",
      demo_slug: "image-workflow-agent",
      ...(source === undefined ? {} : { source }),
    };
  }

  if (
    event.action === "run_workflow" &&
    typeof event.has_reference_image === "boolean"
  ) {
    return {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: event.has_reference_image,
      ...(source === undefined ? {} : { source }),
    };
  }

  return null;
}

export function dispatchDemoAction(
  provider: DemoActionProvider,
  event: DemoActionEvent
): void {
  try {
    const normalizedEvent = normalizeDemoAction(event);

    if (normalizedEvent) {
      provider("demo_action", normalizedEvent);
    }
  } catch {
    // Analytics providers never own the product workflow.
  }
}
