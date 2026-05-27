"use client";

import type { UIMessage } from "ai";
import { useMemo, useState } from "react";

import type { StreamingAudience } from "@/lib/streaming-chat-shell/contract";
import type { StreamingChatShellEvent } from "@/lib/streaming-chat-shell/streaming-turn";

const eventDelimiter = "\n\n";
const dataPrefix = "data:";

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

function parseEventChunk(chunk: string) {
  const dataLines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith(dataPrefix))
    .map((line) => line.slice(dataPrefix.length).trim());

  if (dataLines.length === 0) {
    return null;
  }

  return JSON.parse(dataLines.join("\n")) as StreamingChatShellEvent;
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

export function getReplayTraceText(events: StreamingChatShellEvent[]) {
  return events
    .filter(
      (event): event is Extract<StreamingChatShellEvent, { type: "text" }> =>
        event.type === "text"
    )
    .map((event) => event.text)
    .join("");
}

export function createStreamingReplayEventParser() {
  let buffer = "";

  return {
    push(chunk: string) {
      buffer += chunk;

      const events: StreamingChatShellEvent[] = [];

      while (true) {
        const delimiterIndex = buffer.indexOf(eventDelimiter);

        if (delimiterIndex === -1) {
          return events;
        }

        const rawChunk = buffer.slice(0, delimiterIndex);
        buffer = buffer.slice(delimiterIndex + eventDelimiter.length);

        const event = parseEventChunk(rawChunk);

        if (event) {
          events.push(event);
        }
      }
    },
  };
}

async function replayStreamingPromptTurn(
  audience: StreamingAudience,
  messages: UIMessage[]
) {
  const response = await fetch("/api/demos/streaming-chat-shell/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      audience,
      messages,
    }),
  });

  if (!response.ok) {
    let message = "Failed to replay the custom stream.";

    try {
      const payload = (await response.json()) as { error?: string };

      if (payload.error) {
        message = payload.error;
      }
    } catch {
      const fallbackText = await response.text();

      if (fallbackText) {
        message = fallbackText;
      }
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("The custom event stream returned an empty body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createStreamingReplayEventParser();
  const replayEvents: StreamingChatShellEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const nextEvents = parser.push(decoder.decode(value, { stream: true }));

    if (nextEvents.length > 0) {
      replayEvents.push(...nextEvents);
    }
  }

  const trailingEvents = parser.push(decoder.decode());

  if (trailingEvents.length > 0) {
    replayEvents.push(...trailingEvents);
  }

  return replayEvents;
}

export function useStreamingReplayPrompt(
  audience: StreamingAudience,
  entry: ReplayPromptEntry
) {
  const [events, setEvents] = useState<StreamingChatShellEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const traceText = useMemo(() => getReplayTraceText(events), [events]);
  const isReplayable = entry.replayMessages.length > 0;

  async function replayPrompt() {
    if (!isReplayable) {
      return;
    }

    setEvents([]);
    setError(null);
    setStatus("loading");

    try {
      const replayEvents = await replayStreamingPromptTurn(
        audience,
        entry.replayMessages
      );
      setEvents(replayEvents);
      setStatus("ready");
    } catch (replayError) {
      setError(
        replayError instanceof Error
          ? replayError.message
          : "Failed to replay the custom stream."
      );
      setStatus("error");
    }
  }

  return {
    error,
    events,
    isReplayable,
    status,
    traceText,
    replayPrompt,
  };
}
