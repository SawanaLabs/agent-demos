import type { UIMessage } from "ai";

type FetchLike = typeof fetch;

export interface RemoteLangGraphClientOptions {
  apiKey: string;
  baseUrl: string;
  fetch?: FetchLike;
}

export interface StreamThreadRunOptions {
  assistantId: string;
  messages: UIMessage[];
  streamMode?: Array<"updates" | "messages-tuple">;
  threadId: string;
}

interface LangGraphMessage {
  content: string;
  role: "ai" | "human" | "system";
}

const defaultStreamMode: Array<"updates" | "messages-tuple"> = [
  "updates",
  "messages-tuple",
];
const trailingSlashPattern = /\/+$/;

function normalizeBaseUrl(baseUrl: string) {
  const trimmedBaseUrl = baseUrl.trim().replace(trailingSlashPattern, "");

  if (!trimmedBaseUrl) {
    throw new Error("LANGGRAPH_AGENT_API_URL is required.");
  }

  return trimmedBaseUrl;
}

function requireNonEmpty(value: string, name: string) {
  if (!value.trim()) {
    throw new Error(`${name} is required.`);
  }
}

function toLangGraphRole(role: UIMessage["role"]): LangGraphMessage["role"] {
  if (role === "user") {
    return "human";
  }

  if (role === "assistant") {
    return "ai";
  }

  if (role === "system") {
    return "system";
  }

  throw new Error(`Unsupported UI message role for LangGraph: ${role}`);
}

function readTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function toLangGraphMessages(messages: UIMessage[]): LangGraphMessage[] {
  return messages.map((message) => {
    const content = readTextContent(message);

    if (!content.trim()) {
      throw new Error(`UI message ${message.id} has no text content.`);
    }

    return {
      content,
      role: toLangGraphRole(message.role),
    };
  });
}

export function createRemoteLangGraphClient({
  apiKey,
  baseUrl,
  fetch: fetchImpl = fetch,
}: RemoteLangGraphClientOptions) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const createJsonHeaders = () => ({
    "content-type": "application/json",
    "x-api-key": apiKey,
  });

  return {
    async streamThreadRun({
      assistantId,
      messages,
      streamMode = defaultStreamMode,
      threadId,
    }: StreamThreadRunOptions) {
      requireNonEmpty(assistantId, "LANGGRAPH_AGENT_ASSISTANT_ID");
      requireNonEmpty(threadId, "threadId");

      const threadResponse = await fetchImpl(`${normalizedBaseUrl}/threads`, {
        body: JSON.stringify({
          if_exists: "do_nothing",
          thread_id: threadId,
        }),
        headers: createJsonHeaders(),
        method: "POST",
      });

      if (!threadResponse.ok) {
        const responseText = await threadResponse.text();
        throw new Error(
          `LangGraph thread creation failed with ${threadResponse.status}: ${responseText}`
        );
      }

      const response = await fetchImpl(
        `${normalizedBaseUrl}/threads/${encodeURIComponent(threadId)}/runs/stream`,
        {
          body: JSON.stringify({
            assistant_id: assistantId,
            input: {
              messages: toLangGraphMessages(messages),
            },
            stream_mode: streamMode,
          }),
          headers: createJsonHeaders(),
          method: "POST",
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `LangGraph thread run failed with ${response.status}: ${responseText}`
        );
      }

      return response;
    },
  };
}
