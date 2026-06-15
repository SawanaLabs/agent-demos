import { describe, expect, it } from "vitest";

import { projectGenerativeUiMessage } from "./message-parts";

describe("generative UI message projection", () => {
  it("separates assistant text, UI tool parts, source parts, and auxiliary tool parts", () => {
    const message = {
      id: "m1",
      parts: [
        {
          text: "Here is the comparison.",
          type: "text" as const,
        },
        {
          text: "I need current context before choosing a layout.",
          type: "reasoning" as const,
        },
        {
          input: { query: "current AI app builders" },
          output: {
            action: { query: "current AI app builders", type: "search" },
            sources: [
              { type: "url", url: "https://ai-sdk.dev" },
              { type: "url", url: "https://vercel.com" },
              { type: "api", name: "search_index" },
            ],
          },
          state: "output-available" as const,
          toolCallId: "call_search",
          type: "tool-web_search" as const,
        },
        {
          input: {
            subject: "AI app builders",
          },
          output: {
            criteria: [],
            kind: "feature-comparison",
            options: [],
            subject: "AI app builders",
            summary: "Compare current builders.",
          },
          state: "output-available" as const,
          toolCallId: "call_compare",
          type: "tool-showFeatureComparison" as const,
        },
        {
          providerMetadata: undefined,
          sourceId: "src_1",
          title: "AI SDK",
          type: "source-url" as const,
          url: "https://ai-sdk.dev",
        },
        {
          providerMetadata: undefined,
          sourceId: "src_1_duplicate",
          title: "AI SDK duplicate",
          type: "source-url" as const,
          url: "https://ai-sdk.dev",
        },
      ],
      role: "assistant" as const,
    };

    expect(projectGenerativeUiMessage(message)).toMatchObject({
      auxiliaryToolParts: [
        {
          toolCallId: "call_search",
          type: "tool-web_search",
        },
      ],
      sourceUrlParts: [
        {
          title: "AI SDK",
          url: "https://ai-sdk.dev",
        },
        {
          url: "https://vercel.com",
        },
      ],
      hasReasoningSignal: true,
      reasoningText: "I need current context before choosing a layout.",
      text: "Here is the comparison.",
      uiToolParts: [
        {
          toolCallId: "call_compare",
          type: "tool-showFeatureComparison",
        },
      ],
    });
  });

  it("tracks unrevealed reasoning without rendering placeholder text", () => {
    const message = {
      id: "m2",
      parts: [
        {
          text: "   ",
          type: "reasoning" as const,
        },
      ],
      role: "assistant" as const,
    };

    expect(projectGenerativeUiMessage(message)).toMatchObject({
      hasReasoningSignal: true,
      reasoningText: "",
    });
  });
});
