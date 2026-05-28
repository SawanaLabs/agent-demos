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
      retrievalQueries: ["What does the PDF say about the worm logo?"],
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

  it("falls back to a source-aware retrieval query for broad PDF questions", async () => {
    const findRelevantContent = vi
      .fn()
      .mockResolvedValueOnce({
        answerable: false,
        message:
          "No relevant indexed document snippets were found for this question.",
        sources: [],
      })
      .mockResolvedValueOnce({
        answerable: true,
        message: "Found 1 relevant indexed document snippet.",
        sources: [
          {
            citationLabel: "NASA Graphics Standards Manual, p. 8",
            content:
              "The logotype should always be shown in white against a NASA red background.",
            documentUrl: "https://www.nasa.gov/manual.pdf",
            pageLabel: "8",
            sectionTitle: "The NASA Logotype: Use of Color",
            similarity: 0.83,
            title: "NASA Graphics Standards Manual",
          },
        ],
      });

    const tool = createUltraChatbotAgentSearchKnowledgeBaseTool({
      findRelevantContent,
    });
    const result = await tool.execute?.(
      {
        query: "design principles",
      },
      {} as never
    );

    expect(findRelevantContent).toHaveBeenNthCalledWith(1, "design principles");
    expect(findRelevantContent).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("NASA logotype seal symbol")
    );
    expect(result).toEqual(
      expect.objectContaining({
        answerable: true,
        query: "design principles",
        retrievalQueries: [
          "design principles",
          expect.stringContaining("NASA Graphics Standards Manual"),
        ],
        sources: [
          {
            title: "NASA Graphics Standards Manual, p. 8",
            url: "https://www.nasa.gov/manual.pdf",
          },
        ],
      })
    );
  });
});
