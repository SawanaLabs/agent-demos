import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  convertToModelMessagesMock,
  createOpenAIMock,
  getAiGatewayConfigMock,
  stepCountIsMock,
  streamTextMock,
  toUiMessageStreamResponseMock,
} = vi.hoisted(() => ({
  convertToModelMessagesMock: vi.fn(),
  createOpenAIMock: vi.fn(),
  getAiGatewayConfigMock: vi.fn(),
  stepCountIsMock: vi.fn(),
  streamTextMock: vi.fn(),
  toUiMessageStreamResponseMock: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    convertToModelMessages: convertToModelMessagesMock,
    stepCountIs: stepCountIsMock,
    streamText: streamTextMock,
  };
});

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: createOpenAIMock,
}));

vi.mock("@/features/shared/ai-gateway/server/env", () => ({
  getAiGatewayConfig: getAiGatewayConfigMock,
}));

import { streamTraceEvalAgent } from "./chat";
import { TRACE_EVAL_AGENT_PROVIDER_OPTIONS } from "./model";

describe("streamTraceEvalAgent", () => {
  beforeEach(() => {
    convertToModelMessagesMock.mockReset();
    createOpenAIMock.mockReset();
    getAiGatewayConfigMock.mockReset();
    stepCountIsMock.mockReset();
    streamTextMock.mockReset();
    toUiMessageStreamResponseMock.mockReset();

    convertToModelMessagesMock.mockResolvedValue([
      { content: "converted", role: "user" },
    ]);
    getAiGatewayConfigMock.mockReturnValue({
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
    stepCountIsMock.mockReturnValue("stop-when");
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse: toUiMessageStreamResponseMock,
    });
    toUiMessageStreamResponseMock.mockReturnValue(Response.json({ ok: true }));
  });

  it("streams a research response with Gateway search, sources, and metadata", async () => {
    const messages = [
      {
        id: "m1",
        parts: [
          {
            text: "Research the Browser Use roadmap.",
            type: "text" as const,
          },
        ],
        role: "user" as const,
      },
      {
        id: "m2",
        parts: [
          {
            text: "thinking",
            type: "reasoning" as const,
          },
          {
            input: {
              query: "browser use roadmap",
            },
            output: {
              results: [{ title: "one", snippet: undefined }],
            },
            state: "output-available" as const,
            toolCallId: "call_search",
            type: "tool-web_search" as const,
          },
          {
            providerMetadata: undefined,
            sourceId: "src_1",
            title: "Roadmap source",
            type: "source-url" as const,
            url: "https://example.com/roadmap",
          },
          {
            text: "Browser Use is moving toward richer automation support.",
            type: "text" as const,
          },
        ],
        role: "assistant" as const,
      },
      {
        id: "m3",
        parts: [
          {
            text: "I'm sorry, but I cannot assist with that request.",
            type: "text" as const,
          },
        ],
        role: "assistant" as const,
      },
    ];
    const response = await streamTraceEvalAgent(messages, {
      AI_GATEWAY_API_KEY: "test-key",
      AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
    });

    expect(response.status).toBe(200);
    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: "https://ai-gateway.example/v1",
      name: "gateway-openai",
    });
    expect(convertToModelMessagesMock).toHaveBeenCalledWith([
      messages[0],
      {
        id: "m2",
        parts: [
          {
            text: "Browser Use is moving toward richer automation support.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ]);
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        experimental_telemetry: expect.objectContaining({
          functionId: "trace-eval-agent.run",
          isEnabled: true,
        }),
        messages: [{ content: "converted", role: "user" }],
        model: "openai-model:openai/gpt-5-mini",
        providerOptions: TRACE_EVAL_AGENT_PROVIDER_OPTIONS,
        stopWhen: "stop-when",
        system: expect.stringContaining(
          "Do not exceed two web_search calls in a single answer."
        ),
        tools: {
          web_search: "openai-web-search-tool",
        },
      })
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

    const streamSettings = toUiMessageStreamResponseMock.mock.calls[0]?.[0] as {
      messageMetadata: (options: {
        part: Record<string, unknown>;
      }) => Record<string, unknown>;
    };
    const startMetadata = streamSettings.messageMetadata({
      part: { type: "start" },
    });
    const finishMetadata = streamSettings.messageMetadata({
      part: {
        finishReason: "stop",
        totalUsage: {
          inputTokens: 120,
          outputTokens: 80,
          totalTokens: 200,
        },
        type: "finish",
      },
    });

    expect(startMetadata).toMatchObject({
      model: "openai/gpt-5-mini",
      searchTool: "web_search",
    });
    expect(finishMetadata).toMatchObject({
      finishReason: "stop",
      model: "openai/gpt-5-mini",
      searchTool: "web_search",
      totalUsage: {
        totalTokens: 200,
      },
    });
    expect(startMetadata.runId).toBe(finishMetadata.runId);
  });
});
