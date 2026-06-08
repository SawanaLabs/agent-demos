import type { UIMessage } from "ai";
import { vi } from "vitest";

export const ultraMessageIdPattern = /^ua-msg/;

type VitestMock = ReturnType<typeof vi.fn>;

interface UltraChatbotAgentResponseOptions {
  consumeSseStream?: (input: { stream: ReadableStream }) => Promise<void>;
  generateMessageId?: () => string;
  onFinish?: (input: {
    isAborted: boolean;
    messages: UIMessage[];
  }) => Promise<void>;
  originalMessages?: UIMessage[];
  sendReasoning?: boolean;
  sendSources?: boolean;
}

interface AiMockState {
  responseOptions: UltraChatbotAgentResponseOptions | null;
  stream: VitestMock;
  ToolLoopAgent: VitestMock;
}

interface ResumableStreamFactoryState {
  createResumableStreamContext: VitestMock;
}

interface RedisState {
  Redis: VitestMock;
}

interface ResumableStreamState {
  createNewResumableStream: VitestMock;
  resumeExistingStream: VitestMock;
}

interface StoreState {
  deleteMessagesAfterMessage: VitestMock;
  listChatsForVisitor: VitestMock;
  loadChatSession: VitestMock;
  saveFinishedMessages: VitestMock;
  saveIncomingUserMessage: VitestMock;
  setActiveStream: VitestMock;
}

interface CreateDocumentToolState {
  createUltraChatbotAgentCreateDocumentTool: VitestMock;
}

interface EditDocumentToolState {
  createUltraChatbotAgentEditDocumentTool: VitestMock;
}

interface EnableSandboxToolState {
  createUltraChatbotAgentEnableSandboxTool: VitestMock;
}

interface GetWeatherToolState {
  createUltraChatbotAgentGetWeatherTool: VitestMock;
}

interface SearchKnowledgeBaseToolState {
  createUltraChatbotAgentSearchKnowledgeBaseTool: VitestMock;
}

interface SandboxToolboxState {
  createUltraChatbotAgentSandboxToolbox: VitestMock;
}

interface RequestSuggestionsToolState {
  createUltraChatbotAgentRequestSuggestionsTool: VitestMock;
}

interface ResearchReportToolState {
  createUltraChatbotAgentResearchReportTool: VitestMock;
}

interface UpdateDocumentToolState {
  createUltraChatbotAgentUpdateDocumentTool: VitestMock;
}

interface WebSearchToolState {
  createUltraChatbotAgentWebSearchTool: VitestMock;
}

interface ProjectDocsMcpToolboxState {
  close: VitestMock;
  createUltraChatbotAgentProjectDocsMcpToolbox: VitestMock;
}

const aiMockState: AiMockState = vi.hoisted(() => ({
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

const resumableStreamFactoryState: ResumableStreamFactoryState = vi.hoisted(
  () => ({
    createResumableStreamContext: vi.fn(),
  })
);

const redisState: RedisState = vi.hoisted(() => ({
  Redis: vi.fn(),
}));

const resumableStreamState: ResumableStreamState = vi.hoisted(() => ({
  createNewResumableStream: vi.fn(),
  resumeExistingStream: vi.fn(),
}));

const storeState: StoreState = vi.hoisted(() => ({
  deleteMessagesAfterMessage: vi.fn(),
  listChatsForVisitor: vi.fn(),
  loadChatSession: vi.fn(),
  saveFinishedMessages: vi.fn(),
  saveIncomingUserMessage: vi.fn(),
  setActiveStream: vi.fn(),
}));

const createDocumentToolState: CreateDocumentToolState = vi.hoisted(() => ({
  createUltraChatbotAgentCreateDocumentTool: vi.fn(),
}));

const editDocumentToolState: EditDocumentToolState = vi.hoisted(() => ({
  createUltraChatbotAgentEditDocumentTool: vi.fn(),
}));

const enableSandboxToolState: EnableSandboxToolState = vi.hoisted(() => ({
  createUltraChatbotAgentEnableSandboxTool: vi.fn(),
}));

const getWeatherToolState: GetWeatherToolState = vi.hoisted(() => ({
  createUltraChatbotAgentGetWeatherTool: vi.fn(),
}));

const searchKnowledgeBaseToolState: SearchKnowledgeBaseToolState = vi.hoisted(
  () => ({
    createUltraChatbotAgentSearchKnowledgeBaseTool: vi.fn(),
  })
);

const sandboxToolboxState: SandboxToolboxState = vi.hoisted(() => ({
  createUltraChatbotAgentSandboxToolbox: vi.fn(),
}));

const requestSuggestionsToolState: RequestSuggestionsToolState = vi.hoisted(
  () => ({
    createUltraChatbotAgentRequestSuggestionsTool: vi.fn(),
  })
);

const researchReportToolState: ResearchReportToolState = vi.hoisted(() => ({
  createUltraChatbotAgentResearchReportTool: vi.fn(),
}));

const updateDocumentToolState: UpdateDocumentToolState = vi.hoisted(() => ({
  createUltraChatbotAgentUpdateDocumentTool: vi.fn(),
}));

const webSearchToolState: WebSearchToolState = vi.hoisted(() => ({
  createUltraChatbotAgentWebSearchTool: vi.fn(),
}));

const projectDocsMcpToolboxState: ProjectDocsMcpToolboxState = vi.hoisted(
  () => ({
    close: vi.fn(),
    createUltraChatbotAgentProjectDocsMcpToolbox: vi.fn(),
  })
);

export {
  aiMockState,
  createDocumentToolState,
  editDocumentToolState,
  enableSandboxToolState,
  getWeatherToolState,
  projectDocsMcpToolboxState,
  redisState,
  requestSuggestionsToolState,
  researchReportToolState,
  resumableStreamFactoryState,
  resumableStreamState,
  sandboxToolboxState,
  searchKnowledgeBaseToolState,
  storeState,
  updateDocumentToolState,
  webSearchToolState,
};

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

export function importRuntimeModule() {
  return import("./runtime");
}

export function createUserMessage(): UIMessage {
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

export function createUserMessageWithFile(mediaType: string): UIMessage {
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

export function createAssistantSearchMessage(): UIMessage {
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

export function createAssistantMessage(): UIMessage {
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

export function resetUltraChatbotAgentRuntimeMocks() {
  vi.resetModules();
  resetCoreMocks();
  resetToolMocks();
  mockDefaultRuntimeBehavior();
}

function resetCoreMocks() {
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
}

function resetToolMocks() {
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
}

function mockDefaultRuntimeBehavior() {
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
  mockDefaultToolFactories();
  redisState.Redis.mockImplementation(function MockRedis() {
    return {};
  });
  resumableStreamFactoryState.createResumableStreamContext.mockReturnValue(
    resumableStreamState
  );
}

function mockDefaultToolFactories() {
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
  sandboxToolboxState.createUltraChatbotAgentSandboxToolbox.mockResolvedValue({
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
  });
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
}
