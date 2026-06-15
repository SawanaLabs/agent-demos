import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  convertToModelMessagesMock,
  createOpenAIMock,
  getGenerativeUiConfigMock,
  streamTextMock,
  toUiMessageStreamResponseMock,
} = vi.hoisted(() => ({
  convertToModelMessagesMock: vi.fn(),
  createOpenAIMock: vi.fn(),
  getGenerativeUiConfigMock: vi.fn(),
  streamTextMock: vi.fn(),
  toUiMessageStreamResponseMock: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    convertToModelMessages: convertToModelMessagesMock,
    streamText: streamTextMock,
  };
});

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: createOpenAIMock,
}));

vi.mock("./env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./env")>();

  return {
    ...actual,
    getGenerativeUiConfig: getGenerativeUiConfigMock,
  };
});

import { streamGenerativeUiChat } from "./chat";
import {
  GENERATIVE_UI_PROVIDER_OPTIONS,
  GENERATIVE_UI_SEARCH_TOOL_NAME,
} from "./model";

describe("streamGenerativeUiChat", () => {
  beforeEach(() => {
    convertToModelMessagesMock.mockReset();
    createOpenAIMock.mockReset();
    getGenerativeUiConfigMock.mockReset();
    streamTextMock.mockReset();
    toUiMessageStreamResponseMock.mockReset();

    convertToModelMessagesMock.mockResolvedValue([
      { content: "converted", role: "user" },
    ]);
    getGenerativeUiConfigMock.mockReturnValue({
      apiKey: "test-key",
      baseURL: "https://ai-gateway.example/v3/ai",
      chatModel: "openai/gpt-5-mini",
    });
    createOpenAIMock.mockReturnValue(
      Object.assign(
        vi.fn((modelId: string) => `openai-model:${modelId}`),
        {
          tools: {
            webSearch: vi.fn(() => "openai-web-search-tool"),
          },
        }
      )
    );
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse: toUiMessageStreamResponseMock,
    });
    toUiMessageStreamResponseMock.mockReturnValue(Response.json({ ok: true }));
  });

  it("streams with hosted search plus the two generative UI tools", async () => {
    const messages: UIMessage[] = [
      {
        id: "m1",
        parts: [
          {
            text: "Compare current AI app builders.",
            type: "text" as const,
          },
        ],
        role: "user" as const,
      },
    ];
    const response = await streamGenerativeUiChat(messages, {
      AI_GATEWAY_API_KEY: "test-key",
    });

    expect(response.status).toBe(200);
    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: "https://ai-gateway.example/v1",
      name: "gateway-openai",
    });
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        experimental_telemetry: expect.objectContaining({
          functionId: "generative-ui.run",
          isEnabled: true,
        }),
        messages: [{ content: "converted", role: "user" }],
        model: "openai-model:openai/gpt-5-mini",
        providerOptions: GENERATIVE_UI_PROVIDER_OPTIONS,
        system: expect.stringContaining("Use showFeatureComparison"),
      })
    );

    const streamSettings = streamTextMock.mock.calls[0]?.[0] as {
      stopWhen?: unknown;
      system: string;
      tools: Record<string, unknown>;
    };

    expect(streamSettings.stopWhen).toBeUndefined();
    expect(streamSettings.system).toContain("message-level source channel");
    expect(Object.keys(streamSettings.tools)).toEqual([
      GENERATIVE_UI_SEARCH_TOOL_NAME,
      "showFeatureComparison",
      "showPlanRecommendation",
    ]);
    expect(streamSettings.tools[GENERATIVE_UI_SEARCH_TOOL_NAME]).toBe(
      "openai-web-search-tool"
    );

    const openaiFactory = createOpenAIMock.mock.results[0]?.value as {
      tools: {
        webSearch: ReturnType<typeof vi.fn>;
      };
    };

    expect(openaiFactory.tools.webSearch).toHaveBeenCalledWith({
      searchContextSize: "medium",
    });
    expect(toUiMessageStreamResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        originalMessages: messages,
        sendReasoning: true,
        sendSources: true,
      })
    );
  });

  it("summarizes prior UI tool output before converting follow-up chat history", async () => {
    const messages = [
      {
        id: "user-1",
        parts: [{ text: "Compare agent patterns.", type: "text" as const }],
        role: "user" as const,
      },
      {
        id: "assistant-1",
        parts: [
          {
            input: {
              criteria: [],
              options: [],
              subject: "Agent patterns",
              summary: "RAG grounds answers; tools perform actions.",
            },
            output: {
              kind: "feature-comparison",
              subject: "Agent patterns",
              summary: "RAG grounds answers; tools perform actions.",
            },
            state: "output-available" as const,
            toolCallId: "call_compare",
            type: "tool-showFeatureComparison" as const,
          },
        ],
        role: "assistant" as const,
      },
      {
        id: "user-2",
        parts: [
          {
            text: "Now answer normally: what is 2 plus 2?",
            type: "text" as const,
          },
        ],
        role: "user" as const,
      },
    ];

    await streamGenerativeUiChat(messages, {
      AI_GATEWAY_API_KEY: "test-key",
    });

    expect(convertToModelMessagesMock).toHaveBeenCalledWith([
      messages[0],
      {
        id: "assistant-1",
        parts: [
          {
            text: "Displayed comparison: Agent patterns. RAG grounds answers; tools perform actions.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      messages[2],
    ]);
  });
});
