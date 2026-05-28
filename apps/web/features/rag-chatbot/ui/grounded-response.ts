import type { ToolPart } from "@workspace/ui/components/ai-elements/tool";
import { isToolUIPart, type UIMessage } from "ai";

export interface GroundedSource {
  citationLabel: string;
  content: string;
  documentUrl: string;
  pageLabel: string | null;
  sectionTitle: string | null;
  similarity: number;
  title: string;
}

export interface GroundedMessageProjection {
  sources: GroundedSource[];
  text: string;
  toolParts: ToolPart[];
}

function isGroundedSource(value: unknown): value is GroundedSource {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Record<string, unknown>;

  return (
    typeof source.citationLabel === "string" &&
    typeof source.content === "string" &&
    typeof source.documentUrl === "string" &&
    (source.pageLabel === null || typeof source.pageLabel === "string") &&
    (source.sectionTitle === null || typeof source.sectionTitle === "string") &&
    typeof source.similarity === "number" &&
    typeof source.title === "string"
  );
}

function readSourcesFromToolPart(part: ToolPart) {
  if (part.state !== "output-available" || !part.output) {
    return [];
  }

  if (typeof part.output !== "object" || !("sources" in part.output)) {
    return [];
  }

  const { sources } = part.output as { sources?: unknown[] };

  return Array.isArray(sources)
    ? sources.filter((source): source is GroundedSource =>
        isGroundedSource(source)
      )
    : [];
}

export function getGroundedSourceKey(
  messageId: string,
  source: GroundedSource,
  index: number
) {
  return [
    messageId,
    source.citationLabel,
    source.pageLabel ?? "no-page",
    source.sectionTitle ?? "no-section",
    source.content.slice(0, 96),
    index,
  ].join("::");
}

export function projectGroundedMessage(
  message: UIMessage
): GroundedMessageProjection {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
  const toolParts = message.parts.filter(isToolUIPart) as ToolPart[];
  const sources = toolParts.flatMap((part) => readSourcesFromToolPart(part));

  return {
    sources,
    text,
    toolParts,
  };
}
