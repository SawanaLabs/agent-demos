import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ultraMessageIdPattern = /^ua-msg/;

const aiMockState = vi.hoisted(() => ({
  responseOptions: null as null | {
    consumeSseStream?: (input: { stream: ReadableStream }) => Promise<void>;
    generateMessageId?: () => string;
    onFinish?: (input: {
      isAborted: boolean;
      messages: UIMessage[];
    }) => Promise<void>;
    originalMessages?: UIMessage[];
  },
  streamText: vi.fn(),
}));

const resumableStreamFactoryState = vi.hoisted(() => ({
  createResumableStreamContext: vi.fn(),
}));

const redisState = vi.hoisted(() => ({
  Redis: vi.fn(),
}));

const resumableStreamState = vi.hoisted(() => ({
  createNewResumableStream: vi.fn(),
  resumeExistingStream: vi.fn(),
}));

const storeState = vi.hoisted(() => ({
  listChatsForVisitor: vi.fn(),
  loadChatSession: vi.fn(),
  saveFinishedMessages: vi.fn(),
  saveIncomingUserMessage: vi.fn(),
  setActiveStream: vi.fn(),
}));

const createDocumentToolState = vi.hoisted(() => ({
  createUltraChatbotAgentCreateDocumentTool: vi.fn(),
}));

const editDocumentToolState = vi.hoisted(() => ({
  createUltraChatbotAgentEditDocumentTool: vi.fn(),
}));

const getWeatherToolState = vi.hoisted(() => ({
  createUltraChatbotAgentGetWeatherTool: vi.fn(),
}));

const requestSuggestionsToolState = vi.hoisted(() => ({
  createUltraChatbotAgentRequestSuggestionsTool: vi.fn(),
}));

const updateDocumentToolState = vi.hoisted(() => ({
  createUltraChatbotAgentUpdateDocumentTool: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    streamText: aiMockState.streamText,
  };
});

vi.mock("resumable-stream/ioredis", () => ({
  createResumableStreamContext:
    resumableStreamFactoryState.createResumableStreamContext,
}));

vi.mock("ioredis", () => ({
  default: redisState.Redis,
}));

vi.mock("./chat-store", () => ({
  createUltraChatbotAgentChatStore: vi.fn(() => storeState),
  getUltraChatbotAgentChatNotFoundError: (chatId: string) =>
    `No ultra-chatbot-agent chat found for ${chatId}.`,
}));

vi.mock("./create-document", () => ({
  createUltraChatbotAgentCreateDocumentTool:
    createDocumentToolState.createUltraChatbotAgentCreateDocumentTool,
}));

vi.mock("./edit-document", () => ({
  createUltraChatbotAgentEditDocumentTool:
    editDocumentToolState.createUltraChatbotAgentEditDocumentTool,
}));

vi.mock("./get-weather", () => ({
  createUltraChatbotAgentGetWeatherTool:
    getWeatherToolState.createUltraChatbotAgentGetWeatherTool,
}));

vi.mock("./request-suggestions", () => ({
  createUltraChatbotAgentRequestSuggestionsTool:
    requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool,
}));

vi.mock("./update-document", () => ({
  createUltraChatbotAgentUpdateDocumentTool:
    updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool,
}));

function importRuntimeModule() {
  return import("./runtime");
}

function createUserMessage(): UIMessage {
  return {
    id: "user-1",
    parts: [
      {
        text: "Draft a comparison between artifact-side editing and inline chat.",
        type: "text",
      },
    ],
    role: "user",
  };
}

describe("ultra chatbot agent runtime", () => {
  beforeEach(() => {
    vi.resetModules();
    aiMockState.responseOptions = null;
    aiMockState.streamText.mockReset();
    resumableStreamFactoryState.createResumableStreamContext.mockReset();
    redisState.Redis.mockReset();
    resumableStreamState.createNewResumableStream.mockReset();
    resumableStreamState.resumeExistingStream.mockReset();
    storeState.listChatsForVisitor.mockReset();
    storeState.loadChatSession.mockReset();
    storeState.saveFinishedMessages.mockReset();
    storeState.saveIncomingUserMessage.mockReset();
    storeState.setActiveStream.mockReset();
    createDocumentToolState.createUltraChatbotAgentCreateDocumentTool.mockReset();
    editDocumentToolState.createUltraChatbotAgentEditDocumentTool.mockReset();
    getWeatherToolState.createUltraChatbotAgentGetWeatherTool.mockReset();
    requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool.mockReset();
    updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool.mockReset();

    aiMockState.streamText.mockReturnValue({
      toUIMessageStreamResponse(options: typeof aiMockState.responseOptions) {
        aiMockState.responseOptions = options;
        return Response.json({ ok: true });
      },
    });
    storeState.loadChatSession.mockResolvedValue(null);
    storeState.saveIncomingUserMessage.mockResolvedValue(undefined);
    storeState.saveFinishedMessages.mockResolvedValue(undefined);
    storeState.setActiveStream.mockResolvedValue(undefined);
    createDocumentToolState.createUltraChatbotAgentCreateDocumentTool.mockReturnValue(
      {
        description: "mock create document",
        execute: vi.fn(),
      }
    );
    editDocumentToolState.createUltraChatbotAgentEditDocumentTool.mockReturnValue(
      {
        description: "mock edit document",
        execute: vi.fn(),
      }
    );
    getWeatherToolState.createUltraChatbotAgentGetWeatherTool.mockReturnValue({
      description: "mock get weather",
      execute: vi.fn(),
    });
    requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool.mockReturnValue(
      {
        description: "mock request suggestions",
        execute: vi.fn(),
      }
    );
    updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool.mockReturnValue(
      {
        description: "mock update document",
        execute: vi.fn(),
      }
    );
    redisState.Redis.mockImplementation(function MockRedis() {
      return {};
    });
    resumableStreamFactoryState.createResumableStreamContext.mockReturnValue(
      resumableStreamState
    );
  });

  it("reports setup requirements when gateway, database, or redis config is missing", async () => {
    const { getUltraChatbotAgentRuntimeState } = await importRuntimeModule();

    expect(getUltraChatbotAgentRuntimeState({})).toMatchObject({
      isChatAvailable: false,
      setupMessage: expect.stringContaining("AI_GATEWAY_API_KEY"),
      statusLabel: "Setup required",
    });
  });

  it("rejects unknown selected models before touching persistence", async () => {
    const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

    const response = await handleUltraChatbotAgentChatRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: createUserMessage(),
          selectedChatModel: "anthropic/claude-sonnet-4",
          selectedVisibilityType: "private",
        }),
        method: "POST",
      }),
      { visitorId: "visitor-123" },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.saveIncomingUserMessage).not.toHaveBeenCalled();
  });

  it("persists route-backed turns with selected model and visibility", async () => {
    const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();
    const userMessage = createUserMessage();

    const response = await handleUltraChatbotAgentChatRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: userMessage,
          selectedChatModel: "openai/gpt-5-mini",
          selectedVisibilityType: "private",
        }),
        method: "POST",
      }),
      { visitorId: "visitor-123" },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.saveIncomingUserMessage).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      message: userMessage,
      selectedChatModel: "openai/gpt-5-mini",
      selectedVisibilityType: "private",
      visitorId: "visitor-123",
    });
    expect(aiMockState.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        tools: expect.objectContaining({
          createDocument: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          editDocument: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          getWeather: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          requestSuggestions: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          updateDocument: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
        }),
      })
    );
    expect(
      createDocumentToolState.createUltraChatbotAgentCreateDocumentTool
    ).toHaveBeenCalledWith({
      visitorId: "visitor-123",
    });
    expect(
      editDocumentToolState.createUltraChatbotAgentEditDocumentTool
    ).toHaveBeenCalledWith({
      visitorId: "visitor-123",
    });
    expect(
      getWeatherToolState.createUltraChatbotAgentGetWeatherTool
    ).toHaveBeenCalledWith();
    expect(
      requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool
    ).toHaveBeenCalledWith({
      model: expect.anything(),
      visitorId: "visitor-123",
    });
    expect(
      updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool
    ).toHaveBeenCalledWith({
      model: expect.anything(),
      visitorId: "visitor-123",
    });
    expect(aiMockState.responseOptions?.originalMessages).toEqual([
      userMessage,
    ]);
    expect(aiMockState.responseOptions?.generateMessageId?.()).toMatch(
      ultraMessageIdPattern
    );

    await aiMockState.responseOptions?.consumeSseStream?.({
      stream: new ReadableStream(),
    });

    expect(resumableStreamState.createNewResumableStream).toHaveBeenCalledTimes(
      1
    );
    expect(storeState.setActiveStream).toHaveBeenCalledWith({
      activeStreamId: expect.any(String),
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-123",
    });

    await aiMockState.responseOptions?.onFinish?.({
      isAborted: false,
      messages: [
        userMessage,
        {
          id: "assistant-1",
          parts: [
            {
              text: "An artifact panel lets the document evolve outside the chat scrollback.",
              type: "text",
            },
          ],
          role: "assistant",
        },
      ],
    });

    expect(storeState.saveFinishedMessages).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      messages: expect.arrayContaining([
        expect.objectContaining({ id: "assistant-1", role: "assistant" }),
      ]),
      visitorId: "visitor-123",
    });
  });
});
