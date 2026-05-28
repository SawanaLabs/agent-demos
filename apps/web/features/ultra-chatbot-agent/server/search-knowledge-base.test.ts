import { describe, expect, it, vi } from "vitest";

import { ultraChatbotAgentKnowledgeSource } from "../knowledge-source";

import { createUltraChatbotAgentSearchKnowledgeBaseTool } from "./search-knowledge-base";

describe("ultra chatbot agent search knowledge base tool", () => {
  it("wraps retrieved snippets into an Ultra-friendly tool payload", async () => {
    const findRelevantContent = vi.fn().mockResolvedValue({
      answerable: true,
      message: "Found 2 relevant indexed document snippets.",
      sources: [
        {
          citationLabel: "NASA Graphics Standards Manual, p. 8",
          content: "The NASA worm logo has strict usage guidance.",
          documentUrl: "https://www.nasa.gov/manual.pdf",
          pageLabel: "8",
          sectionTitle: "Worm logo",
          similarity: 0.91,
          title: "NASA Graphics Standards Manual",
        },
      ],
    });

    const tool = createUltraChatbotAgentSearchKnowledgeBaseTool({
      findRelevantContent,
    });
    const result = await tool.execute?.(
      {
        query: "What does the PDF say about the worm logo?",
      },
      {} as never
    );

    expect(findRelevantContent).toHaveBeenCalledWith(
      "What does the PDF say about the worm logo?"
    );
    expect(result).toEqual({
      answerable: true,
      knowledgeSource: ultraChatbotAgentKnowledgeSource,
      message: "Found 2 relevant indexed document snippets.",
      query: "What does the PDF say about the worm logo?",
      snippets: [
        {
          citationLabel: "NASA Graphics Standards Manual, p. 8",
          content: "The NASA worm logo has strict usage guidance.",
          documentUrl: "https://www.nasa.gov/manual.pdf",
          pageLabel: "8",
          sectionTitle: "Worm logo",
          similarity: 0.91,
        },
      ],
      sources: [
        {
          title: "NASA Graphics Standards Manual, p. 8",
          url: "https://www.nasa.gov/manual.pdf",
        },
      ],
    });
  });
});
