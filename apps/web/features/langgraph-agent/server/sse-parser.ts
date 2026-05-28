import type { LangGraphStreamEvent } from "./stream-normalizer";

interface SseFrameFields {
  dataLines: string[];
  event?: string;
}

function readSseLine(line: string, fields: SseFrameFields) {
  if (!line || line.startsWith(":")) {
    return;
  }

  const separatorIndex = line.indexOf(":");
  const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
  const rawValue = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
  const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

  if (field === "event") {
    fields.event = value;
    return;
  }

  if (field === "data") {
    fields.dataLines.push(value);
  }
}

function parseSseFrame(frame: string): LangGraphStreamEvent | null {
  const fields: SseFrameFields = {
    dataLines: [],
  };

  for (const line of frame.split("\n")) {
    readSseLine(line, fields);
  }

  if (!fields.event && fields.dataLines.length === 0) {
    return null;
  }

  const dataText = fields.dataLines.join("\n");

  if (dataText === "[DONE]") {
    return null;
  }

  if (dataText.length === 0) {
    return {
      event: fields.event,
    };
  }

  try {
    return {
      data: JSON.parse(dataText) as unknown,
      event: fields.event,
    };
  } catch (error) {
    throw new Error(
      `Unable to parse LangGraph SSE data as JSON for event "${fields.event ?? "message"}": ${
        error instanceof Error ? error.message : "unknown parse error"
      }`
    );
  }
}

export async function* parseLangGraphSseStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<LangGraphStreamEvent> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      while (buffer.includes("\n\n")) {
        const frameEnd = buffer.indexOf("\n\n");
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const event = parseSseFrame(frame);

        if (event) {
          yield event;
        }
      }
    }

    buffer += decoder.decode().replace(/\r\n/g, "\n");

    if (buffer.trim()) {
      const event = parseSseFrame(buffer);

      if (event) {
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
