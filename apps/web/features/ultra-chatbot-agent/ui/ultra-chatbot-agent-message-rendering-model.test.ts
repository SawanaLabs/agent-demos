import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import { buildUltraChatbotAgentMessageRenderPlan } from "./ultra-chatbot-agent-message-rendering-model";

describe("ultra chatbot agent message rendering model", () => {
  it("builds the render plan for an assistant message with mixed visible parts", () => {
    const message = {
      id: "assistant-1",
      metadata: undefined,
      parts: [
        { text: "First thought.", type: "reasoning" },
        {
          filename: "diagram.png",
          mediaType: "image/png",
          type: "file",
          url: "https://blob.example/diagram.png",
        },
        {
          sourceId: "src-1",
          title: "Project Docs",
          type: "source-url",
          url: "https://example.com/docs",
        },
        {
          input: { topic: "architecture" },
          output: {
            executiveSummary: "Summary",
            keyFindings: ["Finding"],
            kind: "research-report",
            recommendations: ["Recommendation"],
            risks: ["Risk"],
            sources: [{ title: "Docs", url: "https://example.com/docs" }],
            title: "Architecture report",
            topic: "architecture",
          },
          state: "output-available",
          toolCallId: "tool-1",
          type: "tool-createResearchReport",
        },
        { text: "Visible answer.", type: "text" },
        { text: "Second thought.", type: "reasoning" },
      ],
      role: "assistant",
    } satisfies UIMessage;

    const plan = buildUltraChatbotAgentMessageRenderPlan({
      currentVote: true,
      editingMessageId: null,
      isBusy: false,
      isLastMessage: true,
      message,
      pendingVote: { messageId: "assistant-1", target: "down" },
      showThinking: true,
      status: "streaming",
    });

    expect(plan.bodyKind).toBe("text");
    expect(plan.reasoningText).toBe("First thought.\n\nSecond thought.");
    expect(plan.isReasoningStreaming).toBe(true);
    expect(plan.files).toHaveLength(1);
    expect(plan.sources).toEqual([
      {
        sourceId: "src-1",
        title: "Project Docs",
        url: "https://example.com/docs",
      },
    ]);
    expect(plan.toolParts).toHaveLength(1);
    expect(plan.showFeedbackButtons).toBe(false);
    expect(plan.currentVote).toBe(true);
    expect(plan.isNeedsWorkPending).toBe(true);
    expect(plan.showEditButton).toBe(false);
  });
});
