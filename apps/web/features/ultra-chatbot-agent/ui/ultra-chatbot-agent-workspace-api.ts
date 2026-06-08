import type { UIMessage } from "ai";

import type { UltraChatbotAgentCapabilities } from "../server/capabilities";
import type {
  UltraChatbotAgentChatRecord,
  UltraChatbotAgentChatSession,
  UltraChatbotAgentVoteRecord,
} from "../server/chat-store";
import type { UltraChatbotAgentModel } from "../server/models";
import {
  getUltraChatbotAgentTextContent,
  getUltraChatbotAgentToolParts,
  isUltraChatbotAgentDocumentResult,
} from "./ultra-chatbot-agent-message-parts";
import type { UltraChatbotAgentWorkspaceChatMeta } from "./ultra-chatbot-agent-workspace-model";

export function buildHistoryTitleFromMessages(messages: UIMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage
    ? getUltraChatbotAgentTextContent(firstUserMessage).trim()
    : "";

  return text.slice(0, 72) || "New chat";
}

export async function loadUltraChatbotAgentVotes(chatId: string) {
  const searchParams = new URLSearchParams({
    chatId,
  });
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/vote?${searchParams.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load message votes.");
  }

  return (await response.json()) as UltraChatbotAgentVoteRecord[];
}

export async function saveUltraChatbotAgentVote(input: {
  chatId: string;
  messageId: string;
  type: "clear" | "down" | "up";
}) {
  const response = await fetch("/api/demos/ultra-chatbot-agent/vote", {
    body: JSON.stringify(input),
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to save the message vote.");
  }
}

export async function saveUltraChatbotAgentCapabilities(input: {
  chatId: string;
  sandboxEnabled: boolean;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${input.chatId}/capabilities`,
    {
      body: JSON.stringify({
        sandboxEnabled: input.sandboxEnabled,
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update sandbox capability.");
  }

  return (await response.json()) as UltraChatbotAgentCapabilities;
}

export async function trimUltraChatbotAgentMessagesAfterEdit(input: {
  chatId: string;
  messageId: string;
  retainedFileUrls?: string[];
  text: string;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${input.chatId}/messages`,
    {
      body: JSON.stringify({
        messageId: input.messageId,
        retainedFileUrls: input.retainedFileUrls,
        text: input.text,
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to prepare the edited turn.");
  }
}

export function toConversationPath(chatId: string) {
  return `/demos/ultra-chatbot-agent/${chatId}`;
}

export async function loadUltraChatbotAgentSessionSnapshot(chatId: string) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${chatId}/session`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as UltraChatbotAgentChatSession;
}

export function shouldApplyRecoveredSession(
  session: UltraChatbotAgentChatSession,
  messagesLength: number
) {
  return (
    session.messages.length > messagesLength ||
    session.messages.at(-1)?.role !== "user"
  );
}

export function findUltraChatbotAgentModel(
  models: UltraChatbotAgentModel[],
  modelId: string
): UltraChatbotAgentModel | undefined {
  return models.find((model) => model.id === modelId);
}

export function getUltraChatbotAgentDocumentArtifactSignature(
  messages: UIMessage[]
) {
  return messages
    .flatMap((message) =>
      getUltraChatbotAgentToolParts(message).flatMap((part) =>
        part.state === "output-available" &&
        isUltraChatbotAgentDocumentResult(part.output)
          ? [part.output.id]
          : []
      )
    )
    .join("|");
}

export function buildUltraChatbotAgentChatRecordHint(input: {
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
  currentChatTitle: string;
  hasMessages: boolean;
  visitorId: string | undefined;
}): UltraChatbotAgentChatRecord | null {
  const { chatMeta, currentChatTitle, hasMessages, visitorId } = input;
  const hasPersistedChatMeta =
    hasMessages && Boolean(chatMeta.createdAt) && Boolean(chatMeta.updatedAt);

  if (!hasPersistedChatMeta) {
    return null;
  }

  if (!(chatMeta.createdAt && chatMeta.updatedAt)) {
    return null;
  }

  return {
    activeStreamId: null,
    capabilities: chatMeta.capabilities,
    createdAt: chatMeta.createdAt,
    id: chatMeta.id,
    selectedChatModel: chatMeta.selectedChatModel,
    title: currentChatTitle,
    updatedAt: chatMeta.updatedAt,
    visibility: chatMeta.visibility,
    visitorId: visitorId ?? "visitor",
  };
}
