import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  extractProjectGuideCompanionToolLine,
  getProjectGuideCompanionSourceDisplayLabel,
  getProjectGuideCompanionSourceHref,
  getProjectGuideCompanionSurface,
  projectStorableCompanionMessages,
  projectVisibleCompanionMessages,
} from "./project-guide-companion-model";

describe("projectVisibleCompanionMessages", () => {
  it("stores visible text and compact source labels without raw tool output", () => {
    const messages = [
      {
        id: "assistant-1",
        metadata: {
          createdAt: "2026-06-08T12:00:00.000Z",
        },
        parts: [
          {
            input: {},
            output: {
              matches: [
                {
                  line: 18,
                  path: "docs/frontend/project-guide-companion.md",
                  text: "Use sessionStorage as the first-version carrier.",
                },
              ],
              query: "companion history",
            },
            state: "output-available",
            toolCallId: "tool-1",
            toolName: "searchProjectDocs",
            type: "dynamic-tool",
          },
          {
            text: "The companion stores visible tab-local history.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ] satisfies UIMessage[];

    const projected = projectVisibleCompanionMessages(messages);

    expect(projected).toEqual([
      {
        id: "assistant-1",
        metadata: {
          createdAt: "2026-06-08T12:00:00.000Z",
          sources: [
            {
              label: "docs/frontend/project-guide-companion.md",
              line: 18,
            },
          ],
        },
        parts: [
          {
            text: "The companion stores visible tab-local history.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ]);
    expect(JSON.stringify(projected)).not.toContain("matches");
  });

  it("does not persist demo catalog results as docs sources", () => {
    const messages = [
      {
        id: "assistant-1",
        parts: [
          {
            input: {
              pattern: "rag",
              status: "ready",
            },
            output: [
              {
                href: "/demos/rag-chatbot",
                pattern: "rag",
                slug: "rag-chatbot",
                source: "docs/frontend",
                status: "ready",
                title: "RAG Chatbot",
              },
            ],
            state: "output-available",
            toolCallId: "tool-1",
            type: "tool-listDemos",
          },
          {
            text: "RAG Chatbot is the ready RAG demo.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ] satisfies UIMessage[];

    expect(projectVisibleCompanionMessages(messages)).toEqual([
      {
        id: "assistant-1",
        metadata: {
          createdAt: expect.any(String),
        },
        parts: [
          {
            text: "RAG Chatbot is the ready RAG demo.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ]);
  });
});

describe("projectStorableCompanionMessages", () => {
  it("keeps raw UIMessage tool parts for session restore", () => {
    const messages = [
      {
        id: "user-1",
        parts: [
          {
            text: "Which RAG demo should I inspect?",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "assistant-1",
        parts: [
          {
            input: {
              pattern: "rag",
              status: "ready",
            },
            output: [
              {
                href: "/demos/rag-chatbot",
                pattern: "rag",
                slug: "rag-chatbot",
                source: "docs/frontend",
                status: "ready",
                title: "RAG Chatbot",
              },
            ],
            state: "output-available",
            toolCallId: "tool-1",
            type: "tool-listDemos",
          },
          {
            text: "RAG Chatbot is the ready RAG demo.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ] satisfies UIMessage[];

    const storableMessages = projectStorableCompanionMessages(messages);

    expect(storableMessages).toEqual(messages);
    expect(JSON.stringify(storableMessages)).toContain("tool-listDemos");
    expect(JSON.stringify(storableMessages)).toContain("/demos/rag-chatbot");
  });
});

describe("extractProjectGuideCompanionToolLine", () => {
  it("parses MCP-style wrapped JSON into compact source chips", () => {
    const line = extractProjectGuideCompanionToolLine({
      input: {},
      output: {
        content: [
          {
            text: '{"matches":[{"path":"CONTEXT.md","line":12},{"path":"docs/frontend/project-guide-companion.md","line":34}],"query":"project guide"}',
            type: "text",
          },
        ],
        isError: false,
      },
      state: "output-available",
      toolCallId: "tool-1",
      toolName: "searchProjectDocs",
      type: "dynamic-tool",
    });

    expect(line).toEqual({
      demoResults: [],
      hiddenSources: [],
      isPending: false,
      label: "Searched project docs",
      toolName: "searchProjectDocs",
      visibleSources: [
        { label: "CONTEXT.md", line: 12 },
        { label: "docs/frontend/project-guide-companion.md", line: 34 },
      ],
    });
  });

  it("uses demo-docs text for readDemoDocs results", () => {
    const line = extractProjectGuideCompanionToolLine({
      input: {
        slug: "rag-chatbot",
      },
      output: {
        meta: {
          href: "/demos/rag-chatbot",
          title: "RAG Chatbot",
        },
      },
      state: "output-available",
      toolCallId: "tool-1",
      toolName: "readDemoDocs",
      type: "dynamic-tool",
    });

    expect(line).toEqual({
      demoResults: [],
      hiddenSources: [],
      isPending: false,
      label: "Read demo docs",
      toolName: "readDemoDocs",
      visibleSources: [
        {
          href: "/demos/rag-chatbot",
          label: "RAG Chatbot",
        },
      ],
    });
  });

  it("projects listDemos output into demo result cards with demo-specific text", () => {
    const line = extractProjectGuideCompanionToolLine({
      input: {
        pattern: "rag",
        status: "ready",
      },
      output: [
        {
          href: "/demos/rag-chatbot",
          pattern: "rag",
          slug: "rag-chatbot",
          source: "docs/frontend",
          status: "ready",
          summary:
            "Stable source-core, indexing, retrieval, and grounded-answer conventions for the RAG Chatbot demo.",
          title: "RAG Chatbot",
        },
      ],
      state: "output-available",
      toolCallId: "tool-1",
      type: "tool-listDemos",
    });

    expect(line).toEqual({
      demoResults: [
        {
          href: "/demos/rag-chatbot",
          pattern: "rag",
          slug: "rag-chatbot",
          source: "docs/frontend",
          status: "ready",
          summary:
            "Stable source-core, indexing, retrieval, and grounded-answer conventions for the RAG Chatbot demo.",
          title: "RAG Chatbot",
        },
      ],
      hiddenSources: [],
      isPending: false,
      label: "Found 1 demo",
      toolName: "listDemos",
      visibleSources: [],
    });
  });

  it("uses demo-specific loading text while listDemos is running", () => {
    const line = extractProjectGuideCompanionToolLine({
      input: {
        pattern: "rag",
        status: "ready",
      },
      state: "input-available",
      toolCallId: "tool-1",
      type: "tool-listDemos",
    });

    expect(line).toEqual({
      demoResults: [],
      hiddenSources: [],
      isPending: true,
      label: "Finding demos...",
      toolName: "listDemos",
      visibleSources: [],
    });
  });

  it("recognizes demo catalog output when listDemos streams without an explicit tool name", () => {
    const line = extractProjectGuideCompanionToolLine({
      input: {
        pattern: "rag",
        status: "ready",
      },
      output: [
        {
          href: "/demos/rag-chatbot",
          pattern: "rag",
          slug: "rag-chatbot",
          source: "docs/frontend",
          status: "ready",
          title: "RAG Chatbot",
        },
      ],
      state: "output-available",
      toolCallId: "tool-1",
      type: "dynamic-tool",
    });

    expect(line).toEqual({
      demoResults: [
        {
          href: "/demos/rag-chatbot",
          pattern: "rag",
          slug: "rag-chatbot",
          source: "docs/frontend",
          status: "ready",
          title: "RAG Chatbot",
        },
      ],
      hiddenSources: [],
      isPending: false,
      label: "Found 1 demo",
      toolName: "listDemos",
      visibleSources: [],
    });
  });
});

describe("getProjectGuideCompanionSurface", () => {
  it("shows only on the agreed site surfaces", () => {
    expect(getProjectGuideCompanionSurface("/")).toBe("home");
    expect(getProjectGuideCompanionSurface("/registry-guide")).toBe("guide");
    expect(getProjectGuideCompanionSurface("/demos/mcp-agent")).toBe("demo");
    expect(getProjectGuideCompanionSurface("/missing-page")).toBe(null);
  });
});

describe("getProjectGuideCompanionSourceDisplayLabel", () => {
  it("keeps source chips readable while preserving the full label separately", () => {
    expect(
      getProjectGuideCompanionSourceDisplayLabel({
        label: "docs/frontend/project-guide-companion.md",
        line: 34,
      })
    ).toBe("project-guide-companion.md:34");
    expect(
      getProjectGuideCompanionSourceDisplayLabel({ label: "CONTEXT.md" })
    ).toBe("CONTEXT.md");
  });
});

describe("getProjectGuideCompanionSourceHref", () => {
  it("uses explicit source links and maps repo paths to GitHub source URLs", () => {
    expect(
      getProjectGuideCompanionSourceHref({
        href: "/demos/mcp-agent",
        label: "MCP Agent",
      })
    ).toBe("/demos/mcp-agent");
    expect(
      getProjectGuideCompanionSourceHref({
        label: "docs/frontend/project-guide-companion.md",
        line: 34,
      })
    ).toBe(
      "https://github.com/SawanaLabs/agent-demos/blob/main/docs/frontend/project-guide-companion.md#L34"
    );
  });
});
