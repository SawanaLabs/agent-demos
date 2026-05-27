import { beforeEach, describe, expect, it, vi } from "vitest";

const aiState = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    generateText: aiState.generateText,
  };
});

function importWebSearchModule() {
  return import("./web-search");
}

describe("ultra chatbot agent web search tool", () => {
  beforeEach(() => {
    vi.resetModules();
    aiState.generateText.mockReset();
  });

  it("keeps explicit sources from generateText", async () => {
    aiState.generateText.mockResolvedValue({
      sources: [
        {
          type: "source",
          title: "Tesla IR",
          url: "https://ir.tesla.com",
        },
      ],
      text: "Tesla investor relations.",
    });

    const { createUltraChatbotAgentWebSearchTool } = await importWebSearchModule();
    const tool = createUltraChatbotAgentWebSearchTool({
      model: {} as never,
      webSearchTool: {} as never,
    });

    const result = await tool.execute!(
      { query: "Tesla latest" },
      {
        abortSignal: undefined,
        messages: [],
        toolCallId: "call-1",
      }
    );

    expect(result).toMatchObject({
      query: "Tesla latest",
      sources: [
        {
          title: "Tesla IR",
          url: "https://ir.tesla.com",
        },
      ],
      summary: "Tesla investor relations.",
    });
  });

  it("falls back to markdown links in the summary when structured sources are absent", async () => {
    aiState.generateText.mockResolvedValue({
      sources: [],
      text: [
        "Tesla now emphasizes energy storage and autonomy.",
        "[Tesla IR](https://ir.tesla.com)",
        "[Reuters Tesla](https://www.reuters.com/companies/TSLA.OQ)",
      ].join("\n"),
    });

    const { createUltraChatbotAgentWebSearchTool } = await importWebSearchModule();
    const tool = createUltraChatbotAgentWebSearchTool({
      model: {} as never,
      webSearchTool: {} as never,
    });

    const result = await tool.execute!(
      { query: "Tesla latest" },
      {
        abortSignal: undefined,
        messages: [],
        toolCallId: "call-1",
      }
    );

    expect(result).toMatchObject({
      query: "Tesla latest",
      sources: [
        {
          title: "Tesla IR",
          url: "https://ir.tesla.com",
        },
        {
          title: "Reuters Tesla",
          url: "https://www.reuters.com/companies/TSLA.OQ",
        },
      ],
    });
  });
});
