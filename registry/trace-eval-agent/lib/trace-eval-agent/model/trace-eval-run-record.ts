import {
  getToolName,
  isTextUIPart,
  isToolUIPart,
  type LanguageModelUsage,
  type SourceUrlUIPart,
  type UIMessage,
} from "ai";
import { hasTraceEvalResearchIntent } from "./trace-eval-prompt-intent";

export interface TraceEvalAgentMessageMetadata {
  finishedAt?: number;
  finishReason?: string;
  model?: string;
  runId?: string;
  searchTool?: string;
  startedAt?: number;
  totalUsage?: LanguageModelUsage;
}

export type TraceEvalAgentMessage = UIMessage<TraceEvalAgentMessageMetadata>;

export type TraceEvalStatus = "empty" | "running" | "complete";

export interface TraceEvalSource {
  id: string;
  origin: "markdown-link" | "source-part";
  title: string;
  url: string;
}

export interface TraceEvalSearchCall {
  id: string;
  input?: unknown;
  name: string;
  status: "running" | "passed" | "failed";
}

export interface TraceEvalRunRecord {
  durationMs?: number;
  finishReason?: string;
  hasResearchIntent: boolean;
  latestAnswer: string;
  latestPrompt: string | null;
  model?: string;
  runId?: string;
  searchCalls: TraceEvalSearchCall[];
  searchTool: string;
  sources: TraceEvalSource[];
  status: TraceEvalStatus;
  totalTokens?: number;
  usage?: LanguageModelUsage;
}

const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function getLatestUserPrompt(messages: UIMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role === "user") {
      return getMessageText(message).trim() || null;
    }
  }

  return null;
}

function getAssistantMessages(messages: UIMessage[]) {
  return messages.filter(
    (message): message is TraceEvalAgentMessage => message.role === "assistant"
  );
}

function getLatestAssistant(messages: UIMessage[]) {
  return getAssistantMessages(messages).at(-1) ?? null;
}

function getSearchToolName(messages: UIMessage[]) {
  return getLatestAssistant(messages)?.metadata?.searchTool ?? "web_search";
}

function getToolTraceStatus(state: string): TraceEvalSearchCall["status"] {
  if (state === "output-error") {
    return "failed";
  }

  if (state === "output-available") {
    return "passed";
  }

  return "running";
}

function getSearchCalls(messages: UIMessage[]): TraceEvalSearchCall[] {
  const searchToolName = getSearchToolName(messages);

  return getAssistantMessages(messages)
    .flatMap((message) => message.parts.filter(isToolUIPart))
    .filter((part) => getToolName(part) === searchToolName)
    .map((part, index) => ({
      id: `${part.toolCallId}-${index}`,
      input: part.input,
      name: searchToolName,
      status: getToolTraceStatus(part.state),
    }));
}

function toTraceEvalSource(part: SourceUrlUIPart): TraceEvalSource {
  return {
    id: part.sourceId,
    origin: "source-part",
    title: part.title || part.url,
    url: part.url,
  };
}

function getMarkdownLinkSources(text: string): TraceEvalSource[] {
  return Array.from(
    text.matchAll(markdownLinkPattern),
    ([match, rawTitle, rawUrl]) => {
      const url = rawUrl ?? match;
      const title = rawTitle?.trim() || url;

      return {
        id: match,
        origin: "markdown-link",
        title,
        url,
      };
    }
  );
}

function getSources(messages: UIMessage[]): TraceEvalSource[] {
  const latestAssistant = getLatestAssistant(messages);

  if (!latestAssistant) {
    return [];
  }

  const sources = [
    ...latestAssistant.parts.flatMap((part) =>
      part.type === "source-url" ? [toTraceEvalSource(part)] : []
    ),
    ...getMarkdownLinkSources(getMessageText(latestAssistant)),
  ];

  return Array.from(
    new Map(sources.map((source) => [source.url, source])).values()
  );
}

function getDurationMs(metadata: TraceEvalAgentMessageMetadata | undefined) {
  if (!(metadata?.startedAt && metadata.finishedAt)) {
    return;
  }

  return Math.max(0, metadata.finishedAt - metadata.startedAt);
}

export function buildTraceEvalRunRecord(
  messages: UIMessage[],
  isBusy: boolean
): TraceEvalRunRecord {
  const latestPrompt = getLatestUserPrompt(messages);
  const latestAssistant = getLatestAssistant(messages);
  const latestAnswer = latestAssistant
    ? getMessageText(latestAssistant).trim()
    : "";
  const metadata = latestAssistant?.metadata;
  let status: TraceEvalStatus = "complete";

  if (messages.length === 0) {
    status = "empty";
  } else if (isBusy) {
    status = "running";
  }

  return {
    durationMs: getDurationMs(metadata),
    finishReason: metadata?.finishReason,
    hasResearchIntent: hasTraceEvalResearchIntent(latestPrompt),
    latestAnswer,
    latestPrompt,
    model: metadata?.model,
    runId: metadata?.runId,
    searchCalls: getSearchCalls(messages),
    searchTool: getSearchToolName(messages),
    sources: getSources(messages),
    status,
    totalTokens: metadata?.totalUsage?.totalTokens,
    usage: metadata?.totalUsage,
  };
}
