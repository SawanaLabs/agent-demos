import type { UIMessage } from "ai";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GenerativeUiAssistantMessage } from "./generative-ui-workspace";

describe("GenerativeUiAssistantMessage", () => {
  it("renders collapsed UI tool output below reasoning and above assistant body text", () => {
    const message: UIMessage = {
      id: "assistant-1",
      parts: [
        {
          text: "Need to compare the generated options.",
          type: "reasoning",
        },
        {
          input: {
            criteria: [],
            options: [],
            subject: "Support chatbot architecture",
            summary: "Compare RAG, tools, and workflow agents.",
          },
          output: {
            criteria: [],
            kind: "feature-comparison",
            options: [],
            subject: "Support chatbot architecture",
            summary: "Compare RAG, tools, and workflow agents.",
          },
          state: "output-available",
          toolCallId: "call_compare",
          type: "tool-showFeatureComparison",
        },
        {
          text: "Here is the concise body text.",
          type: "text",
        },
      ],
      role: "assistant",
    };

    const markup = renderToStaticMarkup(
      <GenerativeUiAssistantMessage isStreaming={false} message={message} />
    );
    const reasoningIndex = markup.indexOf("Thought for a few seconds");
    const toolOutputIndex = markup.indexOf("Feature comparison tool output");
    const bodyIndex = markup.indexOf("Here is the concise body text.");
    const generatedUiIndex = markup.indexOf("Comparison generated");
    const toolOutputMarkup = markup.slice(
      Math.max(0, toolOutputIndex - 1200),
      toolOutputIndex + 600
    );

    expect(reasoningIndex).toBeGreaterThanOrEqual(0);
    expect(toolOutputIndex).toBeGreaterThan(reasoningIndex);
    expect(toolOutputMarkup).toContain('aria-expanded="false"');
    expect(bodyIndex).toBeGreaterThan(toolOutputIndex);
    expect(generatedUiIndex).toBeGreaterThan(bodyIndex);
  });

  it("renders the UI tool output panel while the tool is still loading", () => {
    const message: UIMessage = {
      id: "assistant-1",
      parts: [
        {
          input: {
            subject: "Support chatbot architecture",
          },
          state: "input-streaming",
          toolCallId: "call_compare",
          type: "tool-showFeatureComparison",
        },
      ],
      role: "assistant",
    };

    const markup = renderToStaticMarkup(
      <GenerativeUiAssistantMessage isStreaming message={message} />
    );

    expect(markup).toContain("Feature comparison tool output");
    expect(markup).toContain("Pending");
    expect(markup).toContain('aria-expanded="false"');
  });

  it("does not render an expandable reasoning shell when the provider returns an empty summary", () => {
    const message: UIMessage = {
      id: "assistant-1",
      parts: [
        {
          text: "",
          type: "reasoning",
        },
        {
          input: {
            criteria: [],
            options: [],
            subject: "Support chatbot architecture",
            summary: "Compare RAG, tools, and workflow agents.",
          },
          output: {
            criteria: [],
            kind: "feature-comparison",
            options: [],
            subject: "Support chatbot architecture",
            summary: "Compare RAG, tools, and workflow agents.",
          },
          state: "output-available",
          toolCallId: "call_compare",
          type: "tool-showFeatureComparison",
        },
      ],
      role: "assistant",
    };

    const markup = renderToStaticMarkup(
      <GenerativeUiAssistantMessage isStreaming={false} message={message} />
    );

    expect(markup).not.toContain("Thought for a few seconds");
    expect(markup).toContain("Feature comparison tool output");
  });
});
