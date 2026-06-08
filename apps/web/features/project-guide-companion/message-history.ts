import { isTextUIPart, type UIMessage } from "ai";

export const projectGuideCompanionContextWindowMs = 30 * 60 * 1000;
export const projectGuideCompanionMaxContextMessages = 12;
export const projectGuideCompanionMaxContextBytes = 16 * 1024;

interface PrepareProjectGuideCompanionContextMessagesInput {
  maxBytes?: number;
  maxMessages?: number;
  messages: UIMessage[];
  now?: Date;
  windowMs?: number;
}

interface ProjectGuideCompanionMessageMetadata {
  createdAt?: string;
  sources?: Array<{ label: string }>;
}

function getMessageMetadata(
  message: UIMessage
): ProjectGuideCompanionMessageMetadata {
  return (message.metadata ?? {}) as ProjectGuideCompanionMessageMetadata;
}

function readMessageCreatedAt(message: UIMessage, fallback: Date) {
  const createdAt = getMessageMetadata(message).createdAt;

  if (!createdAt) {
    return fallback;
  }

  const date = new Date(createdAt);

  return Number.isNaN(date.valueOf()) ? fallback : date;
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function getSourceLabels(message: UIMessage) {
  return [
    ...new Set(
      getMessageMetadata(message)
        .sources?.map((source) => source.label.trim())
        .filter((label) => label.length > 0) ?? []
    ),
  ];
}

function getMessageByteSize(message: UIMessage) {
  return new TextEncoder().encode(JSON.stringify(message)).length;
}

function projectMessage(
  message: UIMessage,
  fallbackCreatedAt: Date
): UIMessage | null {
  if (message.role !== "user" && message.role !== "assistant") {
    return null;
  }

  const text = getMessageText(message);

  if (!text) {
    return null;
  }

  const sourceLabels = getSourceLabels(message);
  const projectedText =
    sourceLabels.length > 0
      ? `${text}\nSources: ${sourceLabels.join(", ")}`
      : text;
  const metadata = getMessageMetadata(message);
  const createdAt =
    metadata.createdAt ??
    readMessageCreatedAt(message, fallbackCreatedAt).toISOString();

  return {
    id: message.id,
    metadata: {
      createdAt,
      ...(sourceLabels.length > 0
        ? {
            sources: sourceLabels.map((label) => ({ label })),
          }
        : {}),
    },
    parts: [
      {
        text: projectedText,
        type: "text" as const,
      },
    ],
    role: message.role,
  };
}

export function prepareProjectGuideCompanionContextMessages({
  maxBytes = projectGuideCompanionMaxContextBytes,
  maxMessages = projectGuideCompanionMaxContextMessages,
  messages,
  now = new Date(),
  windowMs = projectGuideCompanionContextWindowMs,
}: PrepareProjectGuideCompanionContextMessagesInput) {
  const cutoff = now.getTime() - windowMs;
  const projectedMessages = messages
    .filter(
      (message) => message.role === "user" || message.role === "assistant"
    )
    .filter((message) => readMessageCreatedAt(message, now).getTime() >= cutoff)
    .map((message) => projectMessage(message, now))
    .filter((message): message is UIMessage => message !== null)
    .slice(-maxMessages);
  const retainedMessages: UIMessage[] = [];
  let retainedBytes = 0;

  for (const message of [...projectedMessages].reverse()) {
    const byteSize = getMessageByteSize(message);

    if (retainedBytes + byteSize > maxBytes && retainedMessages.length > 0) {
      break;
    }

    retainedMessages.push(message);
    retainedBytes += byteSize;
  }

  return retainedMessages.reverse();
}
