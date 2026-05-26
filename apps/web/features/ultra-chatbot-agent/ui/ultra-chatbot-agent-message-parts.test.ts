import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  getUltraChatbotAgentFileParts,
  getUltraChatbotAgentReasoningText,
} from "./ultra-chatbot-agent-message-parts";

describe("ultra chatbot agent message parts", () => {
  it("joins only reasoning parts and skips text or tool parts", () => {
    const message = {
      id: "assistant-1",
      metadata: undefined,
      parts: [
        { text: "First thought.", type: "reasoning" },
        { text: "Visible answer.", type: "text" },
        {
          input: { title: "Draft" },
          output: { id: "doc-1", title: "Draft" },
          state: "output-available",
          toolCallId: "tool-1",
          type: "tool-createDocument",
        },
        { text: "Second thought.", type: "reasoning" },
      ],
      role: "assistant",
    } satisfies UIMessage;

    expect(getUltraChatbotAgentReasoningText(message)).toBe(
      "First thought.\n\nSecond thought."
    );
  });

  it("returns only file parts with usable urls", () => {
    const message = {
      id: "user-1",
      metadata: undefined,
      parts: [
        { text: "See the mockup.", type: "text" },
        {
          filename: "hero.png",
          mediaType: "image/png",
          type: "file",
          url: "https://blob.example/hero.png",
        },
        {
          input: { city: "Paris" },
          output: { current: {}, current_units: {}, daily: {} },
          state: "output-available",
          toolCallId: "tool-1",
          type: "tool-getWeather",
        },
      ],
      role: "user",
    } satisfies UIMessage;

    expect(getUltraChatbotAgentFileParts(message)).toEqual([
      {
        filename: "hero.png",
        mediaType: "image/png",
        type: "file",
        url: "https://blob.example/hero.png",
      },
    ]);
  });
});
