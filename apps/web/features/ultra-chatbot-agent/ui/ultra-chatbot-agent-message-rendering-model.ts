import type { UIMessage } from "ai";

import {
  getUltraChatbotAgentFileParts,
  getUltraChatbotAgentReasoningText,
  getUltraChatbotAgentSourceParts,
  getUltraChatbotAgentTextContent,
  getUltraChatbotAgentToolParts,
} from "./ultra-chatbot-agent-message-parts";

export type UltraChatbotAgentMessageBodyKind =
  | "files"
  | "source-only"
  | "text"
  | "thinking"
  | "tool-only"
  | "waiting";

export interface UltraChatbotAgentPendingVote {
  messageId: string;
  target: "down" | "up";
}

export interface UltraChatbotAgentMessageRenderPlan {
  bodyKind: UltraChatbotAgentMessageBodyKind;
  currentVote: boolean | undefined;
  files: ReturnType<typeof getUltraChatbotAgentFileParts>;
  isEditing: boolean;
  isHelpfulPending: boolean;
  isNeedsWorkPending: boolean;
  isReasoningStreaming: boolean;
  isVotePending: boolean;
  reasoningText: string;
  showEditButton: boolean;
  showFeedbackButtons: boolean;
  sources: ReturnType<typeof getUltraChatbotAgentSourceParts>;
  text: string;
  toolParts: ReturnType<typeof getUltraChatbotAgentToolParts>;
}

export function buildUltraChatbotAgentMessageRenderPlan(input: {
  currentVote: boolean | undefined;
  editingMessageId: string | null;
  isBusy: boolean;
  isLastMessage: boolean;
  message: UIMessage;
  pendingVote: UltraChatbotAgentPendingVote | null;
  showThinking: boolean;
  status: string;
}): UltraChatbotAgentMessageRenderPlan {
  const {
    currentVote,
    editingMessageId,
    isBusy,
    isLastMessage,
    message,
    pendingVote,
    showThinking,
    status,
  } = input;
  const text = getUltraChatbotAgentTextContent(message);
  const files = getUltraChatbotAgentFileParts(message);
  const sources =
    message.role === "assistant"
      ? getUltraChatbotAgentSourceParts(message)
      : [];
  const toolParts = getUltraChatbotAgentToolParts(message);
  const reasoningText =
    message.role === "assistant"
      ? getUltraChatbotAgentReasoningText(message)
      : "";
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    message.role === "assistant" &&
    isLastMessage &&
    status === "streaming" &&
    lastPart?.type === "reasoning";
  const isVotePending = pendingVote?.messageId === message.id;
  const hasFeedbackTarget =
    text.trim().length > 0 || files.length > 0 || sources.length > 0;

  return {
    bodyKind: getUltraChatbotAgentMessageBodyKind({
      filesLength: files.length,
      isLastMessage,
      message,
      showThinking,
      sourcesLength: sources.length,
      text,
      toolPartsLength: toolParts.length,
    }),
    currentVote,
    files,
    isEditing: editingMessageId === message.id,
    isHelpfulPending: Boolean(isVotePending && pendingVote?.target === "up"),
    isNeedsWorkPending: Boolean(
      isVotePending && pendingVote?.target === "down"
    ),
    isReasoningStreaming,
    isVotePending: Boolean(isVotePending),
    reasoningText,
    showEditButton:
      message.role === "user" && editingMessageId !== message.id && !isBusy,
    showFeedbackButtons:
      message.role === "assistant" &&
      !(isLastMessage && status === "streaming") &&
      !(isLastMessage && status === "submitted") &&
      hasFeedbackTarget,
    sources,
    text,
    toolParts,
  };
}

function getUltraChatbotAgentMessageBodyKind(input: {
  filesLength: number;
  isLastMessage: boolean;
  message: UIMessage;
  showThinking: boolean;
  sourcesLength: number;
  text: string;
  toolPartsLength: number;
}): UltraChatbotAgentMessageBodyKind {
  const {
    filesLength,
    isLastMessage,
    message,
    showThinking,
    sourcesLength,
    text,
    toolPartsLength,
  } = input;

  if (text) {
    return "text";
  }

  if (filesLength > 0) {
    return "files";
  }

  if (
    message.role === "assistant" &&
    isLastMessage &&
    toolPartsLength === 0 &&
    showThinking
  ) {
    return "thinking";
  }

  if (toolPartsLength > 0) {
    return "tool-only";
  }

  if (sourcesLength > 0) {
    return "source-only";
  }

  return "waiting";
}
