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
    sendReasoning?: boolean;
    sendSources?: boolean;
  },
  stream: vi.fn(),
  ToolLoopAgent: vi.fn(),
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
  deleteMessagesAfterMessage: vi.fn(),
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

const enableSandboxToolState = vi.hoisted(() => ({
  createUltraChatbotAgentEnableSandboxTool: vi.fn(),
}));

const getWeatherToolState = vi.hoisted(() => ({
  createUltraChatbotAgentGetWeatherTool: vi.fn(),
}));

const searchKnowledgeBaseToolState = vi.hoisted(() => ({
  createUltraChatbotAgentSearchKnowledgeBaseTool: vi.fn(),
}));

const sandboxToolboxState = vi.hoisted(() => ({
  createUltraChatbotAgentSandboxToolbox: vi.fn(),
}));

const requestSuggestionsToolState = vi.hoisted(() => ({
  createUltraChatbotAgentRequestSuggestionsTool: vi.fn(),
}));

const researchReportToolState = vi.hoisted(() => ({
  createUltraChatbotAgentResearchReportTool: vi.fn(),
}));

const updateDocumentToolState = vi.hoisted(() => ({
  createUltraChatbotAgentUpdateDocumentTool: vi.fn(),
}));

const webSearchToolState = vi.hoisted(() => ({
  createUltraChatbotAgentWebSearchTool: vi.fn(),
}));

const projectDocsMcpToolboxState = vi.hoisted(() => ({
  close: vi.fn(),
  createUltraChatbotAgentProjectDocsMcpToolbox: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    ToolLoopAgent: aiMockState.ToolLoopAgent,
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

vi.mock("./enable-sandbox", () => ({
  createUltraChatbotAgentEnableSandboxTool:
    enableSandboxToolState.createUltraChatbotAgentEnableSandboxTool,
}));

vi.mock("./get-weather", () => ({
  createUltraChatbotAgentGetWeatherTool:
    getWeatherToolState.createUltraChatbotAgentGetWeatherTool,
}));

vi.mock("./search-knowledge-base", () => ({
  createUltraChatbotAgentSearchKnowledgeBaseTool:
    searchKnowledgeBaseToolState.createUltraChatbotAgentSearchKnowledgeBaseTool,
}));

vi.mock("./sandbox-tools", () => ({
  createUltraChatbotAgentSandboxToolbox:
    sandboxToolboxState.createUltraChatbotAgentSandboxToolbox,
}));

vi.mock("./request-suggestions", () => ({
  createUltraChatbotAgentRequestSuggestionsTool:
    requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool,
}));

vi.mock("./research-report", () => ({
  createUltraChatbotAgentResearchReportTool:
    researchReportToolState.createUltraChatbotAgentResearchReportTool,
}));

vi.mock("./update-document", () => ({
  createUltraChatbotAgentUpdateDocumentTool:
    updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool,
}));

vi.mock("./web-search", () => ({
  createUltraChatbotAgentWebSearchTool:
    webSearchToolState.createUltraChatbotAgentWebSearchTool,
}));

vi.mock("./project-docs-mcp", () => ({
  createUltraChatbotAgentProjectDocsMcpToolbox:
    projectDocsMcpToolboxState.createUltraChatbotAgentProjectDocsMcpToolbox,
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

function createUserMessageWithFile(mediaType: string): UIMessage {
  return {
    id: "user-file-1",
    parts: [
      {
        text: "Inspect this attachment.",
        type: "text",
      },
      {
        filename: "attachment",
        mediaType,
        type: "file",
        url: `https://blob.example/attachment-${encodeURIComponent(mediaType)}`,
      },
    ],
    role: "user",
  };
}

function createAssistantSearchMessage(): UIMessage {
  return {
    id: "assistant-search-1",
    parts: [
      {
        text: "Searching",
        type: "reasoning",
      },
      {
        input: { query: "Tesla latest" },
        output: {
          results: [{ title: "Tesla", url: "https://www.tesla.com" }],
        },
        state: "output-available",
        toolCallId: "call_1",
        type: "tool-web_search",
      },
      {
        providerMetadata: undefined,
        sourceId: "src_1",
        title: "Tesla",
        type: "source-url",
        url: "https://www.tesla.com",
      },
      {
        text: "Tesla is a public company focused on EVs and energy.",
        type: "text",
      },
    ],
    role: "assistant",
  };
}

function createAssistantMessage(): UIMessage {
  return {
    id: "assistant-1",
    parts: [
      {
        text: "Artifacts can evolve beside the route-backed conversation.",
        type: "text",
      },
    ],
    role: "assistant",
  };
}

describe("ultra chatbot agent runtime", () => {
  beforeEach(() => {
    vi.resetModules();
    aiMockState.responseOptions = null;
    aiMockState.stream.mockReset();
    aiMockState.ToolLoopAgent.mockReset();
    resumableStreamFactoryState.createResumableStreamContext.mockReset();
    redisState.Redis.mockReset();
    resumableStreamState.createNewResumableStream.mockReset();
    resumableStreamState.resumeExistingStream.mockReset();
    storeState.deleteMessagesAfterMessage.mockReset();
    storeState.listChatsForVisitor.mockReset();
    storeState.loadChatSession.mockReset();
    storeState.saveFinishedMessages.mockReset();
    storeState.saveIncomingUserMessage.mockReset();
    storeState.setActiveStream.mockReset();
    createDocumentToolState.createUltraChatbotAgentCreateDocumentTool.mockReset();
    editDocumentToolState.createUltraChatbotAgentEditDocumentTool.mockReset();
    enableSandboxToolState.createUltraChatbotAgentEnableSandboxTool.mockReset();
    getWeatherToolState.createUltraChatbotAgentGetWeatherTool.mockReset();
    searchKnowledgeBaseToolState.createUltraChatbotAgentSearchKnowledgeBaseTool.mockReset();
    sandboxToolboxState.createUltraChatbotAgentSandboxToolbox.mockReset();
    requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool.mockReset();
    researchReportToolState.createUltraChatbotAgentResearchReportTool.mockReset();
    updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool.mockReset();
    webSearchToolState.createUltraChatbotAgentWebSearchTool.mockReset();
    projectDocsMcpToolboxState.close.mockReset();
    projectDocsMcpToolboxState.createUltraChatbotAgentProjectDocsMcpToolbox.mockReset();

    aiMockState.stream.mockResolvedValue({
      toUIMessageStreamResponse(options: typeof aiMockState.responseOptions) {
        aiMockState.responseOptions = options;
        return Response.json({ ok: true });
      },
    });
    aiMockState.ToolLoopAgent.mockImplementation(function MockToolLoopAgent(
      this: { settings: unknown; stream: typeof aiMockState.stream },
      settings: unknown
    ) {
      this.settings = settings;
      this.stream = aiMockState.stream;
    });
    storeState.loadChatSession.mockResolvedValue(null);
    storeState.deleteMessagesAfterMessage.mockResolvedValue({
      deletedCount: 0,
    });
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
    enableSandboxToolState.createUltraChatbotAgentEnableSandboxTool.mockReturnValue(
      {
        description: "mock enable sandbox",
        execute: vi.fn(),
      }
    );
    getWeatherToolState.createUltraChatbotAgentGetWeatherTool.mockReturnValue({
      description: "mock get weather",
      execute: vi.fn(),
    });
    searchKnowledgeBaseToolState.createUltraChatbotAgentSearchKnowledgeBaseTool.mockReturnValue(
      {
        description: "mock search knowledge base",
        execute: vi.fn(),
      }
    );
    sandboxToolboxState.createUltraChatbotAgentSandboxToolbox.mockResolvedValue(
      {
        availableSkills: [
          {
            description: "Challenge product specs against project docs.",
            name: "grill-with-docs",
          },
        ],
        contextText:
          "Sandbox project root: /vercel/sandbox/project\nAvailable skills:\n- grill-with-docs: Challenge product specs against project docs.",
        tools: {
          bash: {
            description: "mock bash",
            execute: vi.fn(),
          },
          readFile: {
            description: "mock read file",
            execute: vi.fn(),
          },
          skill: {
            description: "mock skill loader",
            execute: vi.fn(),
          },
          writeFile: {
            description: "mock write file",
            execute: vi.fn(),
          },
        },
      }
    );
    requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool.mockReturnValue(
      {
        description: "mock request suggestions",
        execute: vi.fn(),
      }
    );
    researchReportToolState.createUltraChatbotAgentResearchReportTool.mockReturnValue(
      {
        description: "mock research report",
        execute: vi.fn(),
      }
    );
    updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool.mockReturnValue(
      {
        description: "mock update document",
        execute: vi.fn(),
      }
    );
    webSearchToolState.createUltraChatbotAgentWebSearchTool.mockReturnValue({
      description: "mock web search",
      execute: vi.fn(),
    });
    projectDocsMcpToolboxState.createUltraChatbotAgentProjectDocsMcpToolbox.mockResolvedValue(
      {
        close: projectDocsMcpToolboxState.close,
        tools: {
          project__list_demos: {
            description: "mock project docs list",
            execute: vi.fn(),
          },
          project__read_demo_docs: {
            description: "mock project docs read",
            execute: vi.fn(),
          },
          project__search_project_docs: {
            description: "mock project docs search",
            execute: vi.fn(),
          },
        },
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

  it("rejects unsupported attachments before touching persistence", async () => {
    const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

    const response = await handleUltraChatbotAgentChatRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: createUserMessageWithFile("application/zip"),
          selectedChatModel: "openai/gpt-4.1-mini",
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
    await expect(response.json()).resolves.toEqual({
      error: "Only PDF, JPEG, and PNG attachments are supported.",
    });
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
    expect(aiMockState.ToolLoopAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        instructions: expect.any(String),
        providerOptions: {
          openai: {
            reasoningEffort: "medium",
            reasoningSummary: "auto",
            textVerbosity: "low",
          },
        },
        stopWhen: expect.any(Function),
        tools: expect.objectContaining({
          createDocument: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          editDocument: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          enableSandbox: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          getWeather: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          project__list_demos: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          project__read_demo_docs: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          project__search_project_docs: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          searchKnowledgeBase: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          requestSuggestions: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          createResearchReport: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          updateDocument: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
          web_search: expect.objectContaining({
            description: expect.any(String),
            execute: expect.any(Function),
          }),
        }),
      })
    );
    expect(aiMockState.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.any(Array),
      })
    );
    expect(
      createDocumentToolState.createUltraChatbotAgentCreateDocumentTool
    ).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-123",
    });
    expect(
      editDocumentToolState.createUltraChatbotAgentEditDocumentTool
    ).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-123",
    });
    expect(
      enableSandboxToolState.createUltraChatbotAgentEnableSandboxTool
    ).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-123",
    });
    expect(
      getWeatherToolState.createUltraChatbotAgentGetWeatherTool
    ).toHaveBeenCalledWith();
    expect(
      requestSuggestionsToolState.createUltraChatbotAgentRequestSuggestionsTool
    ).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      model: expect.anything(),
      visitorId: "visitor-123",
    });
    expect(
      researchReportToolState.createUltraChatbotAgentResearchReportTool
    ).toHaveBeenCalledWith({
      model: expect.anything(),
    });
    expect(
      updateDocumentToolState.createUltraChatbotAgentUpdateDocumentTool
    ).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      model: expect.anything(),
      visitorId: "visitor-123",
    });
    expect(
      webSearchToolState.createUltraChatbotAgentWebSearchTool
    ).toHaveBeenCalledWith({
      model: expect.anything(),
      webSearchTool: expect.anything(),
    });
    expect(
      projectDocsMcpToolboxState.createUltraChatbotAgentProjectDocsMcpToolbox
    ).toHaveBeenCalledWith({
      origin: "http://localhost",
    });
    expect(
      sandboxToolboxState.createUltraChatbotAgentSandboxToolbox
    ).not.toHaveBeenCalled();
    expect(aiMockState.responseOptions?.originalMessages).toEqual([
      userMessage,
    ]);
    expect(aiMockState.responseOptions?.sendReasoning).toBe(true);
    expect(aiMockState.responseOptions?.sendSources).toBe(true);
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
    expect(projectDocsMcpToolboxState.close).toHaveBeenCalledTimes(1);
  });

  it("projects replay history before sending multi-turn search chats to the model", async () => {
    const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();
    const followUpMessage: UIMessage = {
      id: "user-2",
      parts: [{ text: "Compare it with BYD.", type: "text" }],
      role: "user",
    };

    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        capabilities: {
          sandboxEnabled: false,
        },
        createdAt: new Date("2026-05-27T00:00:00.000Z"),
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        selectedChatModel: "openai/gpt-4.1-mini",
        title: "Tesla research",
        updatedAt: new Date("2026-05-27T00:00:00.000Z"),
        visibility: "private",
        visitorId: "visitor-123",
      },
      messages: [createUserMessage(), createAssistantSearchMessage()],
    });

    const response = await handleUltraChatbotAgentChatRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: followUpMessage,
          selectedChatModel: "openai/gpt-4.1-mini",
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
    expect(aiMockState.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "assistant" }),
        ]),
      })
    );

    const runtimeInput = aiMockState.stream.mock.calls.at(-1)?.[0];
    const assistantMessage = runtimeInput?.messages.find(
      (message: { role: string }) => message.role === "assistant"
    );

    expect(assistantMessage).toBeDefined();
    expect(JSON.stringify(assistantMessage)).toContain(
      "Tesla is a public company focused on EVs and energy."
    );
    expect(JSON.stringify(assistantMessage)).not.toContain("tool-web_search");
    expect(JSON.stringify(assistantMessage)).not.toContain("source-url");
  });

  it("replays a persisted user turn when regenerating a failed assistant response", async () => {
    const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();
    const userMessage = createUserMessage();
    const assistantMessage = createAssistantMessage();

    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        capabilities: {
          sandboxEnabled: false,
        },
        createdAt: new Date("2026-05-27T00:00:00.000Z"),
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        selectedChatModel: "openai/gpt-4.1-mini",
        title: "Retry test",
        updatedAt: new Date("2026-05-27T00:00:00.000Z"),
        visibility: "private",
        visitorId: "visitor-123",
      },
      messages: [userMessage, assistantMessage],
    });

    const response = await handleUltraChatbotAgentChatRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: userMessage,
          messageId: assistantMessage.id,
          selectedChatModel: "openai/gpt-4.1-mini",
          selectedVisibilityType: "private",
          trigger: "regenerate-message",
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
    expect(storeState.deleteMessagesAfterMessage).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      messageId: userMessage.id,
      visitorId: "visitor-123",
    });
    expect(aiMockState.responseOptions?.originalMessages).toEqual([
      userMessage,
    ]);
  });

  it("exposes sandbox-backed tools after sandbox is already enabled", async () => {
    const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        capabilities: {
          sandboxEnabled: true,
        },
        createdAt: new Date("2026-05-27T00:00:00.000Z"),
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        selectedChatModel: "openai/gpt-4.1-mini",
        title: "Sandbox chat",
        updatedAt: new Date("2026-05-27T00:00:00.000Z"),
        visibility: "private",
        visitorId: "visitor-123",
      },
      messages: [createUserMessage()],
    });

    const response = await handleUltraChatbotAgentChatRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: createUserMessage(),
          selectedChatModel: "openai/gpt-4.1-mini",
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
    const runtimeSettings = aiMockState.ToolLoopAgent.mock.calls.at(
      -1
    )?.[0] as {
      tools: Record<string, unknown>;
    };

    expect(runtimeSettings.tools.enableSandbox).toBeUndefined();
    expect(runtimeSettings.tools).toEqual(
      expect.objectContaining({
        bash: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        readFile: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        skill: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
        writeFile: expect.objectContaining({
          description: expect.any(String),
          execute: expect.any(Function),
        }),
      })
    );
    expect(
      enableSandboxToolState.createUltraChatbotAgentEnableSandboxTool
    ).not.toHaveBeenCalled();
    expect(
      sandboxToolboxState.createUltraChatbotAgentSandboxToolbox
    ).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      env: {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      },
      visitorId: "visitor-123",
    });
  });

  it("returns a concrete setup error when enabled sandbox tools cannot be prepared", async () => {
    const { handleUltraChatbotAgentChatRequest } = await importRuntimeModule();

    sandboxToolboxState.createUltraChatbotAgentSandboxToolbox.mockRejectedValue(
      new Error(
        "Vercel Sandbox credentials are missing. Add VERCEL_OIDC_TOKEN or the VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID trio."
      )
    );
    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        capabilities: {
          sandboxEnabled: true,
        },
        createdAt: new Date("2026-05-27T00:00:00.000Z"),
        id: "7dad003a-e507-448b-ac02-10937a0290da",
        selectedChatModel: "openai/gpt-4.1-mini",
        title: "Sandbox chat",
        updatedAt: new Date("2026-05-27T00:00:00.000Z"),
        visibility: "private",
        visitorId: "visitor-123",
      },
      messages: [createUserMessage()],
    });

    const response = await handleUltraChatbotAgentChatRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: createUserMessage(),
          selectedChatModel: "openai/gpt-4.1-mini",
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

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "Vercel Sandbox credentials are missing. Add VERCEL_OIDC_TOKEN or the VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID trio.",
    });
    expect(aiMockState.ToolLoopAgent).not.toHaveBeenCalled();
    expect(projectDocsMcpToolboxState.close).toHaveBeenCalledTimes(1);
  });
});
