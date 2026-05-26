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

export interface UltraChatbotAgentSourcePart {
  sourceId: string;
  title: string;
  url: string;
}

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
