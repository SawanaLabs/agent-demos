import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";

export const projectGuideCompanionStorageKey =
  "project-guide-companion.messages.v1";
export const projectGuideCompanionRevealStorageKey =
  "project-guide-companion.reveal-seen.v1";

export interface ProjectGuideCompanionSource {
  href?: string;
  label: string;
  line?: number;
}

export interface ProjectGuideCompanionDemoResult {
  href?: string;
  pattern?: string;
  slug?: string;
  source?: string;
  status?: string;
  summary?: string;
  title: string;
}

export interface ProjectGuideCompanionToolLine {
  demoResults: ProjectGuideCompanionDemoResult[];
  hiddenSources: ProjectGuideCompanionSource[];
  isPending: boolean;
  label: string;
  toolName: ProjectGuideCompanionToolName | null;
  visibleSources: ProjectGuideCompanionSource[];
}

export type ProjectGuideCompanionToolName =
  | "listDemos"
  | "readDemoDocs"
  | "searchProjectDocs";

export type ProjectGuideCompanionSurface = "demo" | "guide" | "home";

interface ProjectGuideCompanionMessageMetadata {
  createdAt?: string;
  sources?: ProjectGuideCompanionSource[];
}

export interface ProjectGuideCompanionToolPart {
  errorText?: string;
  input?: unknown;
  output?: unknown;
  state?: string;
  toolCallId?: string;
  toolName?: string;
  type?: string;
}

const maxVisibleToolSources = 2;
const projectGuideCompanionToolNames = new Set<ProjectGuideCompanionToolName>([
  "listDemos",
  "readDemoDocs",
  "searchProjectDocs",
]);

export const projectGuideCompanionStarterPrompts = [
  "What is this project trying to show?",
  "Which demos should I inspect first?",
  "How is the registry guide different from demos?",
] as const;

export function getProjectGuideCompanionSurface(
  pathname: string | null
): ProjectGuideCompanionSurface | null {
  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/registry-guide") {
    return "guide";
  }

  if (pathname?.startsWith("/demos/")) {
    return "demo";
  }

  return null;
}

export function getProjectGuideCompanionSourceDisplayLabel(
  source: ProjectGuideCompanionSource
) {
  const label = source.label.trim();
  const pathParts = label.split(/[\\/]/).filter(Boolean);
  const displayLabel = pathParts.at(-1) ?? label;

  return source.line ? `${displayLabel}:${source.line}` : displayLabel;
}

export function getProjectGuideCompanionSourceHref(
  source: ProjectGuideCompanionSource
) {
  const label = source.label.trim();

  if (source.href) {
    return source.href;
  }

  if (/^https?:\/\//.test(label)) {
    return label;
  }

  const encodedPath = label.split(/[\\/]/).map(encodeURIComponent).join("/");
  const lineHash = source.line ? `#L${source.line}` : "";

  return `https://github.com/SawanaLabs/agent-demos/blob/main/${encodedPath}${lineHash}`;
}

function getMessageMetadata(
  message: UIMessage
): ProjectGuideCompanionMessageMetadata {
  return (message.metadata ?? {}) as ProjectGuideCompanionMessageMetadata;
}

export function getProjectGuideCompanionTextContent(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function toSource(
  value: unknown,
  input: { href?: unknown; line?: unknown } = {}
): ProjectGuideCompanionSource | null {
  if (typeof value !== "string") {
    return null;
  }

  const label = value.trim();

  if (!label) {
    return null;
  }

  return {
    ...(typeof input.href === "string" && input.href.trim()
      ? { href: input.href.trim() }
      : {}),
    label,
    ...(typeof input.line === "number" && Number.isInteger(input.line)
      ? { line: input.line }
      : {}),
  };
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function uniqueSources(sources: ProjectGuideCompanionSource[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    const label = source.label.trim();

    if (!label || seen.has(label)) {
      return false;
    }

    seen.add(label);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonString(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function unwrapMcpTextOutput(output: unknown) {
  if (!(isRecord(output) && Array.isArray(output.content))) {
    return output;
  }

  const textContent = output.content.find(
    (entry) => isRecord(entry) && entry.type === "text"
  );

  if (!isRecord(textContent) || typeof textContent.text !== "string") {
    return output;
  }

  return parseJsonString(textContent.text) ?? output;
}

function extractPathSources(entries: unknown[]) {
  const sources: ProjectGuideCompanionSource[] = [];

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue;
    }

    const source = toSource(entry.path, { line: entry.line });

    if (source) {
      sources.push(source);
    }
  }

  return sources;
}

function extractRecordSources(output: Record<string, unknown>) {
  const sources = [
    ...(Array.isArray(output.matches)
      ? extractPathSources(output.matches)
      : []),
    ...(Array.isArray(output.files) ? extractPathSources(output.files) : []),
  ];

  if (sources.length > 0 || !isRecord(output.meta)) {
    return sources;
  }

  const metaSource = toSource(output.meta.title, { href: output.meta.href });

  return metaSource ? [metaSource] : [];
}

function extractSourcesFromOutput(output: unknown) {
  const unwrappedOutput = unwrapMcpTextOutput(output);

  if (Array.isArray(unwrappedOutput)) {
    return [];
  }

  return isRecord(unwrappedOutput)
    ? uniqueSources(extractRecordSources(unwrappedOutput))
    : [];
}

function humanizeProjectGuideCompanionSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toProjectGuideCompanionDemoResult(
  entry: Record<string, unknown>
): ProjectGuideCompanionDemoResult | null {
  const href = toTrimmedString(entry.href);
  const pattern = toTrimmedString(entry.pattern);
  const slug = toTrimmedString(entry.slug);
  const source = toTrimmedString(entry.source);
  const status = toTrimmedString(entry.status);
  const summary = toTrimmedString(entry.summary);
  const title =
    toTrimmedString(entry.title) ??
    (slug ? humanizeProjectGuideCompanionSlug(slug) : null);

  if (!title) {
    return null;
  }

  return {
    ...(href ? { href } : {}),
    ...(pattern ? { pattern } : {}),
    ...(slug ? { slug } : {}),
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
    ...(summary ? { summary } : {}),
    title,
  };
}

function extractDemoResultsFromOutput(output: unknown) {
  const unwrappedOutput = unwrapMcpTextOutput(output);

  if (!Array.isArray(unwrappedOutput)) {
    return [];
  }

  const demos: ProjectGuideCompanionDemoResult[] = [];

  for (const entry of unwrappedOutput) {
    if (!isRecord(entry)) {
      continue;
    }

    const demo = toProjectGuideCompanionDemoResult(entry);

    if (!demo) {
      continue;
    }

    demos.push(demo);
  }

  return demos;
}

export function getProjectGuideCompanionSources(message: UIMessage) {
  const metadataSources = getMessageMetadata(message).sources ?? [];
  const toolSources = message.parts.filter(isToolUIPart).flatMap((part) => {
    const toolPart = part as ProjectGuideCompanionToolPart;

    return extractSourcesFromOutput(toolPart.output);
  });

  return uniqueSources([...metadataSources, ...toolSources]);
}

function toProjectGuideCompanionToolName(
  value: unknown
): ProjectGuideCompanionToolName | null {
  if (
    typeof value === "string" &&
    projectGuideCompanionToolNames.has(value as ProjectGuideCompanionToolName)
  ) {
    return value as ProjectGuideCompanionToolName;
  }

  return null;
}

export function getProjectGuideCompanionToolName(
  part: ProjectGuideCompanionToolPart
) {
  const explicitToolName = toProjectGuideCompanionToolName(part.toolName);

  if (explicitToolName) {
    return explicitToolName;
  }

  const typeToolName =
    typeof part.type === "string" && part.type.startsWith("tool-")
      ? part.type.slice("tool-".length)
      : null;

  return toProjectGuideCompanionToolName(typeToolName);
}

function getToolLabel(input: {
  demoResultCount: number;
  hasError: boolean;
  isPending: boolean;
  toolName: ProjectGuideCompanionToolName | null;
}) {
  if (input.hasError) {
    return "Tool failed";
  }

  switch (input.toolName) {
    case "listDemos":
      if (input.isPending) {
        return "Finding demos...";
      }

      return input.demoResultCount === 1
        ? "Found 1 demo"
        : `Found ${input.demoResultCount} demos`;
    case "readDemoDocs":
      return input.isPending ? "Reading demo docs..." : "Read demo docs";
    case "searchProjectDocs":
      return input.isPending
        ? "Searching project docs..."
        : "Searched project docs";
    default:
      return input.isPending ? "Checking docs..." : "Checked docs";
  }
}

export function extractProjectGuideCompanionToolLine(
  part: ProjectGuideCompanionToolPart
): ProjectGuideCompanionToolLine {
  const hasError = Boolean(part.errorText);
  const isPending =
    !hasError &&
    part.state !== "output-available" &&
    part.state !== "output-error";
  const outputDemoResults = isPending
    ? []
    : extractDemoResultsFromOutput(part.output);
  const explicitToolName = getProjectGuideCompanionToolName(part);
  const toolName =
    explicitToolName ?? (outputDemoResults.length > 0 ? "listDemos" : null);
  const sources =
    isPending || toolName === "listDemos"
      ? []
      : extractSourcesFromOutput(part.output);
  const demoResults =
    isPending || toolName !== "listDemos" ? [] : outputDemoResults;

  return {
    demoResults,
    hiddenSources: sources.slice(maxVisibleToolSources),
    isPending,
    label: getToolLabel({
      demoResultCount: demoResults.length,
      hasError,
      isPending,
      toolName,
    }),
    toolName,
    visibleSources: sources.slice(0, maxVisibleToolSources),
  };
}

export function projectVisibleCompanionMessages(
  messages: UIMessage[],
  now = new Date()
): UIMessage[] {
  const visibleMessages: UIMessage[] = [];

  for (const message of messages) {
    if (message.role !== "user" && message.role !== "assistant") {
      continue;
    }

    const text = getProjectGuideCompanionTextContent(message);

    if (!text) {
      continue;
    }

    const metadata = getMessageMetadata(message);
    const sources = getProjectGuideCompanionSources(message);

    visibleMessages.push({
      id: message.id,
      metadata: {
        createdAt: metadata.createdAt ?? now.toISOString(),
        ...(sources.length > 0 ? { sources } : {}),
      },
      parts: [{ text, type: "text" as const }],
      role: message.role,
    });
  }

  return visibleMessages;
}

export function projectStorableCompanionMessages(
  messages: UIMessage[]
): UIMessage[] {
  return messages.filter(
    (message) => message.role === "user" || message.role === "assistant"
  );
}
