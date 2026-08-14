import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  convertToModelMessagesMock,
  createOpenAIMock,
  stepCountIsMock,
  streamTextMock,
  toUiMessageStreamResponseMock,
} = vi.hoisted(() => ({
  convertToModelMessagesMock: vi.fn(),
  createOpenAIMock: vi.fn(),
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

import { streamMinimalChatAgent } from "./chat";

describe("streamMinimalChatAgent", () => {
  beforeEach(() => {
    convertToModelMessagesMock.mockReset();
    createOpenAIMock.mockReset();
    stepCountIsMock.mockReset();
    streamTextMock.mockReset();
    toUiMessageStreamResponseMock.mockReset();

    convertToModelMessagesMock.mockResolvedValue([
      { content: "converted", role: "user" },
    ]);
    createOpenAIMock.mockReturnValue(
      Object.assign(
        vi.fn((modelId: string) => `openai-model:${modelId}`),
        {
          tools: {
            webSearch: vi.fn(() => "provider-web-search"),
          },
        }
      )
    );
    stepCountIsMock.mockReturnValue("five-step-limit");
    streamTextMock.mockReturnValue({
      toUIMessageStreamResponse: toUiMessageStreamResponseMock,
    });
    toUiMessageStreamResponseMock.mockReturnValue(Response.json({ ok: true }));
  });

  it("streams a bounded agent loop with search, GitHub, and ask-user tools", async () => {
    const abortController = new AbortController();
    const messages: UIMessage[] = [
      {
        id: "message-1",
        parts: [
          {
            text: "Help me choose an agent template; ask me what matters first.",
            type: "text" as const,
          },
        ],
        role: "user" as const,
      },
    ];

    const response = await streamMinimalChatAgent(
      messages,
      {
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_BASE_URL: "https://ai-gateway.example/v3/ai",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
      },
      abortController.signal
    );

    expect(response.status).toBe(200);
    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: "https://ai-gateway.example/v1",
      name: "gateway-openai",
    });
    expect(stepCountIsMock).toHaveBeenCalledWith(5);
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: abortController.signal,
        maxOutputTokens: 4096,
        messages: [{ content: "converted", role: "user" }],
        model: "openai-model:openai/gpt-5-mini",
        stopWhen: "five-step-limit",
        system: expect.stringContaining(
          "Use ask_user instead of guessing when the request is ambiguous"
        ),
      })
    );

    const settings = streamTextMock.mock.calls[0]?.[0] as {
      tools: Record<string, unknown>;
    };
    expect(Object.keys(settings.tools)).toEqual([
      "web_search",
      "github_repo",
      "ask_user",
    ]);
    expect(settings.tools.web_search).toBe("provider-web-search");

    const openaiFactory = createOpenAIMock.mock.results[0]?.value as {
      tools: { webSearch: ReturnType<typeof vi.fn> };
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
});
