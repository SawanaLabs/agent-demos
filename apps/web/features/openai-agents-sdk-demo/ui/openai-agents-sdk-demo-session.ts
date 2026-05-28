import {
  isReasoningUIPart,
  isToolUIPart,
  type FileUIPart,
  type SourceUrlUIPart,
  type UIMessage,
} from "ai";
import type { ToolPart } from "@workspace/ui/components/ai-elements/tool";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

export interface OpenAiAgentsSdkDemoSourcePart {
  sourceId: string;
  title: string;
  url: string;
}

export interface OpenAiAgentsSdkDemoApprovalInputField {
  label: string;
  value: string;
}

const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const reasoningSignalPlaceholder =
  "The model emitted a reasoning item for this turn, but the upstream stream did not expose revealable reasoning text.";
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
  const text = getOpenAiAgentsSdkDemoMessageText(message);

  if (text.trim().length === 0) {
    return [] as OpenAiAgentsSdkDemoSourcePart[];
  }

  const sources = new Map<string, OpenAiAgentsSdkDemoSourcePart>();

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

    if (sources.has(url)) {
      continue;
    }

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

function getStringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function getOpenAiAgentsSdkDemoMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function getOpenAiAgentsSdkDemoReasoningText(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("\n\n");
}

function hasOpenAiAgentsSdkDemoReasoningStreamSignal(message: UIMessage) {
  const metadata = message.metadata as
    | OpenAiAgentsSdkDemoMessageMetadata
    | undefined;
  const streamSummary = metadata?.streamSummary;

  if (!streamSummary) {
    return false;
  }

  return (
    streamSummary.runItemEventNames.includes("reasoning_item_created") ||
    streamSummary.rawModelEventTypes.some((eventType) =>
      eventType.toLowerCase().includes("reasoning"),
    )
  );
}

export function getOpenAiAgentsSdkDemoRenderableReasoningText(
  message: UIMessage,
) {
  const reasoningText = getOpenAiAgentsSdkDemoReasoningText(message).trim();

  if (reasoningText.length > 0) {
    return reasoningText;
  }

  if (hasOpenAiAgentsSdkDemoReasoningStreamSignal(message)) {
    return reasoningSignalPlaceholder;
  }

  return "";
}

export function getOpenAiAgentsSdkDemoFileParts(message: UIMessage) {
  return message.parts.filter(
    (part): part is FileUIPart => part.type === "file",
  );
}

export function getOpenAiAgentsSdkDemoSourceParts(message: UIMessage) {
  const explicitSources = message.parts
    .filter(
      (part): part is SourceUrlUIPart =>
        part.type === "source-url" &&
        typeof part.sourceId === "string" &&
        typeof part.url === "string",
    )
    .map((part) => ({
      sourceId: part.sourceId,
      title: part.title?.trim() || part.url,
      url: part.url,
    }));

  if (explicitSources.length > 0) {
    return explicitSources;
  }

  return collectTextCitationSources(message);
}

export function getOpenAiAgentsSdkDemoToolParts(message: UIMessage) {
  return message.parts.filter(isToolUIPart) as ToolPart[];
}

export function shouldRenderOpenAiAgentsSdkDemoReasoning(
  message: UIMessage,
  nextMessage?: UIMessage,
) {
  const reasoningText =
    getOpenAiAgentsSdkDemoRenderableReasoningText(message).trim();

  if (reasoningText.length === 0) {
    return false;
  }

  if (nextMessage?.role !== "assistant") {
    return true;
  }

  const hasRespondedApproval = getOpenAiAgentsSdkDemoToolParts(message).some(
    (part) => part.state === "approval-responded",
  );

  if (!hasRespondedApproval) {
    return true;
  }

  return (
    getOpenAiAgentsSdkDemoRenderableReasoningText(nextMessage).trim().length ===
    0
  );
}

export function hasOpenAiAgentsSdkDemoVisibleContent(message: UIMessage) {
  return (
    getOpenAiAgentsSdkDemoMessageText(message).trim().length > 0 ||
    getOpenAiAgentsSdkDemoRenderableReasoningText(message).trim().length > 0 ||
    getOpenAiAgentsSdkDemoFileParts(message).length > 0 ||
    getOpenAiAgentsSdkDemoSourceParts(message).length > 0 ||
    getOpenAiAgentsSdkDemoToolParts(message).length > 0
  );
}

export function getOpenAiAgentsSdkDemoFailedTurnRetryText(
  messages: UIMessage[],
) {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role === "user") {
    const text = getOpenAiAgentsSdkDemoMessageText(lastMessage).trim();
    return text.length > 0 ? text : null;
  }

  const previousMessage = messages.at(-2);

  if (lastMessage?.role === "assistant" && previousMessage?.role === "user") {
    const text = getOpenAiAgentsSdkDemoMessageText(previousMessage).trim();
    return text.length > 0 ? text : null;
  }

  return null;
}

export function getOpenAiAgentsSdkDemoRecoverableMessages<
  TMessage extends UIMessage,
>(messages: TMessage[]) {
  const nextMessages = [...messages];
  const lastMessage = nextMessages.at(-1);

  if (lastMessage?.role === "assistant") {
    nextMessages.pop();
  }

  if (nextMessages.at(-1)?.role === "user") {
    nextMessages.pop();
  }

  return nextMessages;
}

export function getOpenAiAgentsSdkDemoToolName(part: ToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}

export function getOpenAiAgentsSdkDemoToolDisplayState(
  part: ToolPart,
  { isMessageStreaming }: { isMessageStreaming: boolean },
): ToolPart["state"] {
  if (
    !isMessageStreaming &&
    (part.state === "input-available" || part.state === "input-streaming")
  ) {
    return "output-available";
  }

  return part.state;
}

export function getOpenAiAgentsSdkDemoApprovalInputFields(
  part: ToolPart,
): OpenAiAgentsSdkDemoApprovalInputField[] {
  const input = getStringRecord(part.input);

  if (!input) {
    return [];
  }

  const approvalFields = [
    ["audience", "Audience"],
    ["company", "Company"],
    ["summary", "Summary"],
  ] as const;

  return approvalFields.flatMap(([key, label]) => {
    const value = input[key];

    if (typeof value !== "string" || value.trim().length === 0) {
      return [];
    }

    return [
      {
        label,
        value,
      },
    ];
  });
}
