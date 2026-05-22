"use client";

import type { UIMessage } from "ai";

export interface ReplayPromptEntry {
  id: string;
  promptText: string;
  replayMessages: UIMessage[];
}

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function getReplayPromptEntries(messages: UIMessage[]) {
  const entries: ReplayPromptEntry[] = [];

  messages.forEach((message, index) => {
    if (message.role !== "user") {
      return;
    }

    const promptText = getTextContent(message);

    if (!promptText) {
      return;
    }

    entries.push({
      id: message.id,
      promptText,
      replayMessages: messages.slice(0, index + 1),
    });
  });

  return entries.reverse();
}
