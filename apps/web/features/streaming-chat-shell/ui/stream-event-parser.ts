import type { StreamingChatShellEvent } from "../server/events";

const eventDelimiter = "\n\n";
const dataPrefix = "data:";

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

export function createStreamingChatShellEventParser() {
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
