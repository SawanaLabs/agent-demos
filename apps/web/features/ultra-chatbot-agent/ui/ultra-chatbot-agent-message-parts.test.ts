import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  getUltraChatbotAgentFileParts,
  getUltraChatbotAgentProjectDocsMcpResult,
  getUltraChatbotAgentReasoningText,
  getUltraChatbotAgentSourceParts,
  hasUltraChatbotAgentVisibleMessageContent,
  isUltraChatbotAgentDocumentResult,
  isUltraChatbotAgentKnowledgeBaseResult,
  isUltraChatbotAgentResearchReportResult,
} from "./ultra-chatbot-agent-message-parts";

describe("ultra chatbot agent message text and file parts", () => {
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

describe("ultra chatbot agent source parts", () => {
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

  it("falls back to web_search tool sources when source-url parts are absent", () => {
    const message = {
      id: "assistant-2b",
      metadata: undefined,
      parts: [
        {
          input: { query: "Tesla latest" },
          output: {
            query: "Tesla latest",
            sources: [
              {
                title: "Tesla investor relations",
                url: "https://ir.tesla.com",
              },
              {
                title: "Reuters Tesla coverage",
                url: "https://www.reuters.com/companies/TSLA.OQ",
              },
            ],
            summary: "Tesla remains focused on EVs and energy.",
          },
          state: "output-available",
          toolCallId: "tool-1",
          type: "tool-web_search",
        },
      ],
      role: "assistant",
    } satisfies UIMessage;

    expect(getUltraChatbotAgentSourceParts(message)).toEqual([
      {
        sourceId: "https://ir.tesla.com#Tesla investor relations",
        title: "Tesla investor relations",
        url: "https://ir.tesla.com",
      },
      {
        sourceId:
          "https://www.reuters.com/companies/TSLA.OQ#Reuters Tesla coverage",
        title: "Reuters Tesla coverage",
        url: "https://www.reuters.com/companies/TSLA.OQ",
      },
    ]);
  });

  it("falls back to searchKnowledgeBase tool sources when source-url parts are absent", () => {
    const message = {
      id: "assistant-rag-1",
      metadata: undefined,
      parts: [
        {
          input: { query: "worm logo" },
          output: {
            answerable: true,
            message: "Found 1 relevant indexed document snippet.",
            query: "worm logo",
            snippets: [
              {
                citationLabel: "NASA Graphics Standards Manual, p. 8",
                content: "The NASA worm logo has strict usage guidance.",
                documentUrl: "https://www.nasa.gov/manual.pdf",
              },
            ],
            sources: [
              {
                citationLabel: "NASA Graphics Standards Manual, p. 8",
                documentUrl: "https://www.nasa.gov/manual.pdf",
              },
            ],
          },
          state: "output-available",
          toolCallId: "tool-rag-1",
          type: "tool-searchKnowledgeBase",
        },
      ],
      role: "assistant",
    } satisfies UIMessage;

    expect(getUltraChatbotAgentSourceParts(message)).toEqual([
      {
        sourceId:
          "https://www.nasa.gov/manual.pdf#NASA Graphics Standards Manual, p. 8",
        title: "NASA Graphics Standards Manual, p. 8",
        url: "https://www.nasa.gov/manual.pdf",
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
});

describe("ultra chatbot agent result guards", () => {
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

  it("recognizes structured research report tool outputs", () => {
    expect(
      isUltraChatbotAgentResearchReportResult({
        executiveSummary: "A short evidence-backed summary.",
        keyFindings: ["Finding one"],
        kind: "research-report",
        recommendations: ["Do one concrete next step"],
        risks: ["Evidence may drift"],
        sources: [{ title: "AI SDK", url: "https://ai-sdk.dev" }],
        title: "Research Brief",
        topic: "AI SDK",
      })
    ).toBe(true);
    expect(
      isUltraChatbotAgentResearchReportResult({
        keyFindings: ["Finding one"],
        kind: "research-report",
        title: "Research Brief",
      } as never)
    ).toBe(false);
  });

  it("recognizes knowledge-base retrieval tool outputs", () => {
    expect(
      isUltraChatbotAgentKnowledgeBaseResult({
        answerable: true,
        message: "Found 1 relevant indexed document snippet.",
        query: "worm logo",
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
      })
    ).toBe(true);
    expect(
      isUltraChatbotAgentKnowledgeBaseResult({
        answerable: true,
        snippets: [],
      } as never)
    ).toBe(false);
  });
});

describe("ultra chatbot agent project docs MCP result parsing", () => {
  it("parses project-docs MCP search outputs into renderable matches", () => {
    expect(
      getUltraChatbotAgentProjectDocsMcpResult({
        input: { query: "ultra" },
        output: {
          content: [
            {
              text: JSON.stringify({
                matches: [
                  {
                    line: 10,
                    path: "docs/frontend/ultra-chatbot-agent.md",
                    text: "- Treat MCP as a first-class capability family.",
                  },
                ],
                query: "ultra",
              }),
              type: "text",
            },
          ],
        },
        state: "output-available",
        toolCallId: "tool-project-docs-1",
        type: "tool-project__search_project_docs",
      })
    ).toEqual({
      kind: "search",
      matches: [
        {
          line: 10,
          path: "docs/frontend/ultra-chatbot-agent.md",
          text: "- Treat MCP as a first-class capability family.",
        },
      ],
      query: "ultra",
    });
  });
});
