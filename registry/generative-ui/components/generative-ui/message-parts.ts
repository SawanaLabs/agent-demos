import type { ToolPart } from "@/components/ai-elements/tool";
import {
  isReasoningUIPart,
  isToolUIPart,
  type SourceUrlUIPart,
  type UIMessage,
} from "ai";

export const featureComparisonToolPartType = "tool-showFeatureComparison";
export const planRecommendationToolPartType = "tool-showPlanRecommendation";
export const webSearchToolPartType = "tool-web_search";

export type GenerativeUiSource = Pick<
  SourceUrlUIPart,
  "sourceId" | "title" | "url"
>;

export type GenerativeUiToolPart = ToolPart & {
  type:
    | typeof featureComparisonToolPartType
    | typeof planRecommendationToolPartType;
};

export interface GenerativeUiMessageProjection {
  auxiliaryToolParts: ToolPart[];
  hasReasoningSignal: boolean;
  reasoningText: string;
  sourceUrlParts: GenerativeUiSource[];
  text: string;
  uiToolParts: GenerativeUiToolPart[];
}

export function isGenerativeUiToolPart(
  part: UIMessage["parts"][number]
): part is GenerativeUiToolPart {
  return (
    isToolUIPart(part) &&
    (part.type === featureComparisonToolPartType ||
      part.type === planRecommendationToolPartType)
  );
}

function isSourceUrlPart(
  part: UIMessage["parts"][number]
): part is SourceUrlUIPart {
  return (
    part.type === "source-url" &&
    "sourceId" in part &&
    typeof part.sourceId === "string" &&
    part.sourceId.trim().length > 0 &&
    "url" in part &&
    typeof part.url === "string" &&
    part.url.trim().length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWebSearchUrlSource(
  value: unknown
): value is { type: "url"; url: string } {
  return (
    isRecord(value) &&
    value.type === "url" &&
    typeof value.url === "string" &&
    value.url.trim().length > 0
  );
}

function addSource(
  sources: Map<string, GenerativeUiSource>,
  source: GenerativeUiSource
) {
  const sourceKey = source.url.trim();

  if (!sources.has(sourceKey)) {
    sources.set(sourceKey, {
      ...source,
      url: sourceKey,
    });
  }
}

function addWebSearchOutputSources(
  sources: Map<string, GenerativeUiSource>,
  part: ToolPart
) {
  if (part.type !== webSearchToolPartType || !isRecord(part.output)) {
    return;
  }

  const rawSources = part.output.sources;

  if (!Array.isArray(rawSources)) {
    return;
  }

  rawSources.filter(isWebSearchUrlSource).forEach((source, index) => {
    addSource(sources, {
      sourceId: `web_search_${index}_${source.url}`,
      url: source.url,
    });
  });
}

function getSourceUrlParts(message: UIMessage) {
  const sources = new Map<string, GenerativeUiSource>();

  for (const part of message.parts) {
    if (!isSourceUrlPart(part)) {
      continue;
    }

    addSource(sources, part);
  }

  for (const part of message.parts) {
    if (!isToolUIPart(part)) {
      continue;
    }

    addWebSearchOutputSources(sources, part as ToolPart);
  }

  return [...sources.values()];
}

export function projectGenerativeUiMessage(
  message: UIMessage
): GenerativeUiMessageProjection {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
  const reasoningParts = message.parts.filter(isReasoningUIPart);
  const joinedReasoningText = reasoningParts
    .map((part) => part.text)
    .join("\n\n")
    .trim();
  const toolParts = message.parts.filter(isToolUIPart) as ToolPart[];
  const uiToolParts = message.parts.filter(isGenerativeUiToolPart);

  return {
    auxiliaryToolParts: toolParts.filter(
      (part) => !isGenerativeUiToolPart(part)
    ),
    hasReasoningSignal: reasoningParts.length > 0,
    reasoningText: joinedReasoningText,
    sourceUrlParts: getSourceUrlParts(message),
    text,
    uiToolParts,
  };
}
