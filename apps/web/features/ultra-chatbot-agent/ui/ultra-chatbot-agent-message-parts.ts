import {
  type DynamicToolUIPart,
  type FileUIPart,
  isReasoningUIPart,
  type SourceUrlUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";

export type UltraChatbotAgentToolPart = DynamicToolUIPart | ToolUIPart;

export interface UltraChatbotAgentDocumentToolResult {
  id: string;
  kind: string;
  title: string;
}

interface UltraChatbotAgentToolSourcesResult {
  sources: Array<
    | {
        title: string;
        url: string;
      }
    | {
        citationLabel: string;
        documentUrl: string;
      }
  >;
}

export interface UltraChatbotAgentKnowledgeBaseResult {
  answerable: boolean;
  knowledgeSource?: {
    description?: string;
    title: string;
  };
  message: string;
  query: string;
  snippets: Array<{
    citationLabel: string;
    content: string;
    documentUrl: string;
    pageLabel?: string;
    sectionTitle?: string;
    similarity?: number;
  }>;
  sources: Array<{
    title: string;
    url: string;
  }>;
}

export interface UltraChatbotAgentSourcePart {
  sourceId: string;
  title: string;
  url: string;
}

export interface UltraChatbotAgentResearchReportResult {
  executiveSummary: string;
  keyFindings: string[];
  kind: "research-report";
  recommendations: string[];
  risks: string[];
  sources: Array<{
    title: string;
    url: string;
  }>;
  title: string;
  topic: string;
}

export interface UltraChatbotAgentProjectDocsSearchResult {
  kind: "search";
  matches: Array<{
    line: number;
    path: string;
    text: string;
  }>;
  query: string;
}

export type UltraChatbotAgentProjectDocsMcpResult =
  UltraChatbotAgentProjectDocsSearchResult;

const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const explicitUrlPattern = /\bhttps?:\/\/[^\s)]+/g;
const domainCitationPattern =
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s),\]]*)?/gi;

function normalizeCitationUrl(value: string) {
  const trimmed = value.trim().replace(/[),.;]+$/g, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function collectTextCitationSources(message: UIMessage) {
  const text = message.parts
    .filter((part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
      part.type === "text" && part.text.trim().length > 0
    )
    .map((part) => part.text)
    .join("\n");

  if (text.length === 0) {
    return [] as UltraChatbotAgentSourcePart[];
  }

  const sources = new Map<string, UltraChatbotAgentSourcePart>();

  for (const match of text.matchAll(markdownLinkPattern)) {
    const [, label, rawUrl] = match;
    if (typeof rawUrl !== "string") {
      continue;
    }

    const url = normalizeCitationUrl(rawUrl);
    const title = typeof label === "string" ? label.trim() : "";

    sources.set(url, {
      sourceId: url,
      title: title || url,
      url,
    });
  }

  for (const match of text.matchAll(explicitUrlPattern)) {
    const url = normalizeCitationUrl(match[0]);

    sources.set(url, {
      sourceId: url,
      title: url.replace(/^https?:\/\//, ""),
      url,
    });
  }

  for (const match of text.matchAll(domainCitationPattern)) {
    const url = normalizeCitationUrl(match[0]);

    if (sources.has(url)) {
      continue;
    }

    sources.set(url, {
      sourceId: url,
      title: url.replace(/^https?:\/\//, ""),
      url,
    });
  }

  return [...sources.values()].sort((left, right) => {
    const leftIndex = text.indexOf(left.title);
    const rightIndex = text.indexOf(right.title);

    return leftIndex - rightIndex;
  });
}

function hasUltraChatbotAgentToolSources(
  output: UltraChatbotAgentToolPart["output"]
): output is UltraChatbotAgentToolSourcesResult {
  if (!output || typeof output !== "object" || !("sources" in output)) {
    return false;
  }

  return Array.isArray(output.sources);
}

function normalizeToolSource(
  source: UltraChatbotAgentToolSourcesResult["sources"][number]
) {
  if (
    "url" in source &&
    typeof source.url === "string" &&
    typeof source.title === "string"
  ) {
    const title = source.title.trim() || source.url;
    const url = source.url.trim();

    return url.length === 0
      ? null
      : {
          sourceId: `${url}#${title}`,
          title,
          url,
        };
  }

  if (
    "documentUrl" in source &&
    typeof source.documentUrl === "string" &&
    typeof source.citationLabel === "string"
  ) {
    const title = source.citationLabel.trim() || source.documentUrl;
    const url = source.documentUrl.trim();

    return url.length === 0
      ? null
      : {
          sourceId: `${url}#${title}`,
          title,
          url,
        };
  }

  return null;
}

export function getUltraChatbotAgentReasoningText(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("\n\n");
}

export function getUltraChatbotAgentFileParts(message: UIMessage) {
  return message.parts.filter(
    (part): part is FileUIPart =>
      part.type === "file" && typeof part.url === "string"
  );
}

export function getUltraChatbotAgentSourceParts(message: UIMessage) {
  const explicitSources = message.parts.filter(
    (part): part is SourceUrlUIPart =>
      part.type === "source-url" &&
      typeof part.url === "string" &&
      typeof part.sourceId === "string"
  ).map((part) => ({
    sourceId: part.sourceId,
    title: part.title?.trim() || part.url,
    url: part.url,
  }));

  if (explicitSources.length > 0) {
    return explicitSources;
  }

  const toolSources = message.parts
    .filter(isUltraChatbotAgentToolPart)
    .flatMap((part) =>
      part.state === "output-available" &&
      hasUltraChatbotAgentToolSources(part.output)
        ? part.output.sources
            .map(normalizeToolSource)
            .filter(
              (
                source
              ): source is {
                sourceId: string;
                title: string;
                url: string;
              } => source !== null
            )
        : []
    );

  if (toolSources.length > 0) {
    return toolSources;
  }

  return collectTextCitationSources(message);
}

export function isUltraChatbotAgentToolPart(
  part: UIMessage["parts"][number]
): part is UltraChatbotAgentToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export function getUltraChatbotAgentToolParts(message: UIMessage) {
  return message.parts.filter(isUltraChatbotAgentToolPart);
}

export function hasUltraChatbotAgentVisibleMessageContent(message: UIMessage) {
  return message.parts.some(
    (part) =>
      (part.type === "text" && part.text.trim().length > 0) ||
      (isReasoningUIPart(part) && part.text.trim().length > 0) ||
      isUltraChatbotAgentToolPart(part)
  );
}

export function isUltraChatbotAgentDocumentResult(
  output: UltraChatbotAgentToolPart["output"]
): output is UltraChatbotAgentDocumentToolResult {
  if (!output || typeof output !== "object") {
    return false;
  }

  return (
    "id" in output &&
    typeof output.id === "string" &&
    "title" in output &&
    typeof output.title === "string" &&
    "kind" in output &&
    typeof output.kind === "string"
  );
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResearchReportSources(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "title" in item &&
        typeof item.title === "string" &&
        "url" in item &&
        typeof item.url === "string"
    )
  );
}

function isKnowledgeBaseSnippet(value: unknown) {
  return (
    value &&
    typeof value === "object" &&
    "citationLabel" in value &&
    typeof value.citationLabel === "string" &&
    "content" in value &&
    typeof value.content === "string" &&
    "documentUrl" in value &&
    typeof value.documentUrl === "string"
  );
}

function readMcpJsonText(output: UltraChatbotAgentToolPart["output"]) {
  if (!output || typeof output !== "object" || !("content" in output)) {
    return null;
  }

  const { content } = output;

  if (!Array.isArray(content)) {
    return null;
  }

  const firstTextPart = content.find(
    (part) =>
      part &&
      typeof part === "object" &&
      "type" in part &&
      part.type === "text" &&
      "text" in part &&
      typeof part.text === "string"
  );

  if (!firstTextPart || !("text" in firstTextPart)) {
    return null;
  }

  try {
    return JSON.parse(firstTextPart.text as string) as unknown;
  } catch {
    return null;
  }
}

function isProjectDocsSearchPayload(
  value: unknown
): value is Omit<UltraChatbotAgentProjectDocsSearchResult, "kind"> {
  return (
    value !== null &&
    typeof value === "object" &&
    "query" in value &&
    typeof value.query === "string" &&
    "matches" in value &&
    Array.isArray(value.matches) &&
    value.matches.every(
      (match) =>
        match &&
        typeof match === "object" &&
        "path" in match &&
        typeof match.path === "string" &&
        "line" in match &&
        typeof match.line === "number" &&
        "text" in match &&
        typeof match.text === "string"
    )
  );
}

export function isUltraChatbotAgentResearchReportResult(
  output: UltraChatbotAgentToolPart["output"]
): output is UltraChatbotAgentResearchReportResult {
  if (!output || typeof output !== "object") {
    return false;
  }

  return (
    "kind" in output &&
    output.kind === "research-report" &&
    "title" in output &&
    typeof output.title === "string" &&
    "topic" in output &&
    typeof output.topic === "string" &&
    "executiveSummary" in output &&
    typeof output.executiveSummary === "string" &&
    "keyFindings" in output &&
    isStringArray(output.keyFindings) &&
    "recommendations" in output &&
    isStringArray(output.recommendations) &&
    "risks" in output &&
    isStringArray(output.risks) &&
    "sources" in output &&
    isResearchReportSources(output.sources)
  );
}

export function isUltraChatbotAgentKnowledgeBaseResult(
  output: UltraChatbotAgentToolPart["output"]
): output is UltraChatbotAgentKnowledgeBaseResult {
  if (!output || typeof output !== "object") {
    return false;
  }

  return (
    "answerable" in output &&
    typeof output.answerable === "boolean" &&
    "message" in output &&
    typeof output.message === "string" &&
    "query" in output &&
    typeof output.query === "string" &&
    "snippets" in output &&
    Array.isArray(output.snippets) &&
    output.snippets.every(isKnowledgeBaseSnippet) &&
    "sources" in output &&
    isResearchReportSources(output.sources)
  );
}

export function getUltraChatbotAgentProjectDocsMcpResult(
  part: UltraChatbotAgentToolPart
): UltraChatbotAgentProjectDocsMcpResult | null {
  if (
    part.state !== "output-available" ||
    part.type !== "tool-project__search_project_docs"
  ) {
    return null;
  }

  const parsed = readMcpJsonText(part.output);

  if (!isProjectDocsSearchPayload(parsed)) {
    return null;
  }

  return {
    kind: "search",
    matches: parsed.matches,
    query: parsed.query,
  };
}
