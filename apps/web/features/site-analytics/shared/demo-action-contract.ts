export const acceptedDemoActionHeader = "x-agent-demo-action";

export const demoActionCatalog = {
  "canvas-agent": ["send_message"],
  "customer-memory-agent": ["compact_context", "send_message"],
  "feedback-agent": ["send_message"],
  "foundation-chat": ["send_message"],
  "generative-ui": ["send_message"],
  "image-workflow-agent": ["modify_workflow", "run_workflow", "send_message"],
  "langgraph-agent": ["send_message"],
  "loop-agent": ["send_message"],
  "mcp-agent": ["send_message"],
  "minimal-chat-agent": ["send_message"],
  "multi-agent-explorer": ["send_message"],
  "multimodal-chatbot": ["send_message"],
  "object-generation": ["generate_object"],
  "openai-agents-sdk-demo": ["send_message"],
  "persistent-agent": ["send_message"],
  "rag-chatbot": ["send_message"],
  "sandbox-agent": ["send_message"],
  "skills-agent": ["send_message"],
  "streaming-chat-shell": ["send_message"],
  "trace-eval-agent": ["evaluate", "send_message"],
  "ultra-chatbot-agent": ["edit_message", "send_message"],
} as const;

export type DemoActionSource = "agent" | "manual";
export type DemoActionSlug = keyof typeof demoActionCatalog;
export type CatalogDemoAction =
  (typeof demoActionCatalog)[DemoActionSlug][number];

export interface DemoActionEvent {
  readonly action: CatalogDemoAction;
  readonly demo_slug: DemoActionSlug;
  readonly has_reference_image?: boolean;
  readonly source?: DemoActionSource;
}

const allowedSources = new Set<DemoActionSource>(["agent", "manual"]);
const allowedActionsByDemo = new Map<string, ReadonlySet<string>>(
  Object.entries(demoActionCatalog).map(([demoSlug, actions]) => [
    demoSlug,
    new Set<string>(actions),
  ])
);

function normalizeOptionalSource(
  value: unknown
): DemoActionSource | null | undefined {
  if (value === undefined) {
    return;
  }

  return typeof value === "string" &&
    allowedSources.has(value as DemoActionSource)
    ? (value as DemoActionSource)
    : null;
}

export function isCatalogDemoAction(
  demoSlug: unknown,
  action: unknown
): demoSlug is DemoActionSlug {
  if (!(typeof demoSlug === "string" && typeof action === "string")) {
    return false;
  }

  return allowedActionsByDemo.get(demoSlug)?.has(action) ?? false;
}

export function normalizeDemoAction(input: unknown): DemoActionEvent | null {
  if (!(input && typeof input === "object")) {
    return null;
  }

  const event = input as Readonly<Record<string, unknown>>;

  if (!isCatalogDemoAction(event.demo_slug, event.action)) {
    return null;
  }

  const action = event.action as CatalogDemoAction;
  const source = normalizeOptionalSource(event.source);

  if (source === null) {
    return null;
  }

  if (event.demo_slug === "image-workflow-agent" && action === "run_workflow") {
    if (typeof event.has_reference_image !== "boolean") {
      return null;
    }

    return {
      action,
      demo_slug: event.demo_slug,
      has_reference_image: event.has_reference_image,
      ...(source === undefined ? {} : { source }),
    };
  }

  return {
    action,
    demo_slug: event.demo_slug,
    ...(source === undefined ? {} : { source }),
  };
}

export function serializeAcceptedDemoAction(input: {
  readonly action: unknown;
  readonly demoSlug: unknown;
}): string | null {
  if (!isCatalogDemoAction(input.demoSlug, input.action)) {
    return null;
  }

  return `${input.demoSlug}:${input.action}`;
}

export function parseAcceptedDemoAction(
  value: unknown
): DemoActionEvent | null {
  if (typeof value !== "string") {
    return null;
  }

  const separatorIndex = value.indexOf(":");

  if (
    separatorIndex <= 0 ||
    separatorIndex !== value.lastIndexOf(":") ||
    separatorIndex === value.length - 1
  ) {
    return null;
  }

  return normalizeDemoAction({
    action: value.slice(separatorIndex + 1),
    demo_slug: value.slice(0, separatorIndex),
  });
}
