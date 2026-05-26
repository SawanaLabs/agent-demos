import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  getUltraChatbotAgentFileParts,
  getUltraChatbotAgentReasoningText,
  getUltraChatbotAgentSourceParts,
  hasUltraChatbotAgentVisibleMessageContent,
  isUltraChatbotAgentDocumentResult,
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

  it("returns only source-url parts with title and url", () => {
    const message = {
      id: "assistant-2",
      metadata: undefined,
      parts: [
        {
          sourceId: "src-1",
          title: "AI SDK docs",
          type: "source-url",
          url: "https://ai-sdk.dev/docs",
        },
        { text: "See the attached research.", type: "text" },
      ],
      role: "assistant",
    } satisfies UIMessage;

    expect(getUltraChatbotAgentSourceParts(message)).toEqual([
      {
        sourceId: "src-1",
        title: "AI SDK docs",
        url: "https://ai-sdk.dev/docs",
      },
    ]);
  });

  it("falls back to domain citations in assistant text when source-url parts are absent", () => {
    const message = {
      id: "assistant-3",
      metadata: undefined,
      parts: [
        {
          text: "Kimi and MiniMax both publish public artifacts. (arxiv.org) (github.com/minimax-ai) See also https://platform.kimi.ai/models.",
          type: "text",
        },
      ],
      role: "assistant",
    } satisfies UIMessage;

    expect(getUltraChatbotAgentSourceParts(message)).toEqual([
      {
        sourceId: "https://arxiv.org",
        title: "arxiv.org",
        url: "https://arxiv.org",
      },
      {
        sourceId: "https://github.com/minimax-ai",
        title: "github.com/minimax-ai",
        url: "https://github.com/minimax-ai",
      },
      {
        sourceId: "https://platform.kimi.ai/models",
        title: "platform.kimi.ai/models",
        url: "https://platform.kimi.ai/models",
      },
    ]);
  });

  it("treats tool-only assistant messages as visible content", () => {
    const message = {
      id: "assistant-1",
      metadata: undefined,
      parts: [
        {
          input: { title: "Draft" },
          output: { id: "doc-1", kind: "text", title: "Draft" },
          state: "output-available",
          toolCallId: "tool-1",
          type: "tool-createDocument",
        },
      ],
      role: "assistant",
    } satisfies UIMessage;

    expect(hasUltraChatbotAgentVisibleMessageContent(message)).toBe(true);
  });

  it("recognizes document tool outputs by id, kind, and title", () => {
    expect(
      isUltraChatbotAgentDocumentResult({
        id: "doc-1",
        kind: "text",
        title: "Draft",
      })
    ).toBe(true);
    expect(
      isUltraChatbotAgentDocumentResult({
        id: "doc-1",
        title: "Draft",
      } as never)
    ).toBe(false);
  });
});
