"use client";

import type { UIMessage } from "ai";
import { useState } from "react";

import { trimUltraChatbotAgentMessagesAfterEdit } from "./ultra-chatbot-agent-workspace-api";

export function useUltraChatbotAgentMessageEditing(input: {
  chatId: string;
  regenerate: () => PromiseLike<void> | void;
  setMessages: (
    messages: UIMessage[] | ((currentMessages: UIMessage[]) => UIMessage[])
  ) => void;
}) {
  const { chatId, regenerate, setMessages } = input;
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingRetainedFileUrls, setEditingRetainedFileUrls] = useState<
    string[]
  >([]);
  const [editingText, setEditingText] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  async function handleSaveEdit(message: UIMessage) {
    const nextText = editingText.trim();

    if (!nextText) {
      setEditError("Edited message text cannot be empty.");
      return;
    }

    setEditError(null);

    try {
      await trimUltraChatbotAgentMessagesAfterEdit({
        chatId,
        messageId: message.id,
        retainedFileUrls: editingRetainedFileUrls,
        text: nextText,
      });

      setMessages((currentMessages) =>
        replaceEditedMessage({
          currentMessages,
          editingRetainedFileUrls,
          message,
          nextText,
        })
      );

      handleCancelEdit();
      await regenerate();
    } catch (editSaveError) {
      setEditError(
        editSaveError instanceof Error
          ? editSaveError.message
          : "Failed to prepare the edited turn."
      );
    }
  }

  function handleCancelEdit() {
    setEditingMessageId(null);
    setEditingRetainedFileUrls([]);
    setEditingText("");
    setEditError(null);
  }

  function handleStartEdit(input: {
    messageId: string;
    retainedFileUrls: string[];
    text: string;
  }) {
    setEditingMessageId(input.messageId);
    setEditingRetainedFileUrls(input.retainedFileUrls);
    setEditingText(input.text);
    setEditError(null);
  }

  function handleRemoveEditingFile(url: string) {
    setEditingRetainedFileUrls((current) =>
      current.filter((currentUrl) => currentUrl !== url)
    );
  }

  return {
    editError,
    editingMessageId,
    editingRetainedFileUrls,
    editingText,
    handleCancelEdit,
    handleRemoveEditingFile,
    handleSaveEdit,
    handleStartEdit,
    setEditingText,
  };
}

function replaceEditedMessage(input: {
  currentMessages: UIMessage[];
  editingRetainedFileUrls: string[];
  message: UIMessage;
  nextText: string;
}) {
  const { currentMessages, editingRetainedFileUrls, message, nextText } = input;
  const messageIndex = currentMessages.findIndex(
    (currentMessage) => currentMessage.id === message.id
  );

  if (messageIndex === -1) {
    return currentMessages;
  }

  const retainedFileUrlSet = new Set(editingRetainedFileUrls);

  return [
    ...currentMessages.slice(0, messageIndex),
    {
      ...message,
      parts: [
        ...message.parts.filter((part) => {
          if (part.type === "text") {
            return false;
          }

          if (part.type === "file") {
            return retainedFileUrlSet.has(part.url);
          }

          return true;
        }),
        { text: nextText, type: "text" as const },
      ],
    },
  ];
}
