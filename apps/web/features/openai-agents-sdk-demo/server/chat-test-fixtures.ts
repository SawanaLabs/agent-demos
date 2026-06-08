import { vi } from "vitest";

type VitestMock = ReturnType<typeof vi.fn>;

interface GuardrailTripwireTriggeredMock {
  new (message: string, result: unknown): Error & { result: unknown };
}

interface MemorySessionMockConstructor {
  nextId: number;
  new (options?: {
    initialItems?: unknown[];
    sessionId?: string;
  }): {
    addItems(items: unknown[]): Promise<void>;
    clearSession(): Promise<void>;
    getItems(): Promise<unknown[]>;
    getSessionId(): Promise<string>;
    items: unknown[];
    popItem(): Promise<unknown>;
    sessionId: string;
  };
}

interface ChatMockState {
  agentConstructorMock: VitestMock;
  CapabilitiesMock: {
    default: VitestMock;
  };
  codeInterpreterToolMock: VitestMock;
  connectMcpServersMock: VitestMock;
  createAiSdkUiMessageStreamMock: VitestMock;
  createMCPToolStaticFilterMock: VitestMock;
  createUiMessageStreamMock: VitestMock;
  createUiMessageStreamResponseMock: VitestMock;
  defineOutputGuardrailMock: VitestMock;
  fileSearchToolMock: VitestMock;
  generateTraceIdMock: VitestMock;
  handoffMock: VitestMock;
  InputGuardrailTripwireTriggeredMock: GuardrailTripwireTriggeredMock;
  imageGenerationToolMock: VitestMock;
  localDirMock: VitestMock;
  ManifestMock: VitestMock;
  MCPServerStreamableHttpMock: VitestMock;
  MemorySessionMock: MemorySessionMockConstructor;
  OutputGuardrailTripwireTriggeredMock: GuardrailTripwireTriggeredMock;
  openAiConstructorMock: VitestMock;
  RunStateMock: {
    fromString: VitestMock;
  };
  runMock: VitestMock;
  SandboxAgentMock: VitestMock;
  setDefaultOpenAIClientMock: VitestMock;
  setOpenAIAPIMock: VitestMock;
  setOpenAIResponsesTransportMock: VitestMock;
  toolMock: VitestMock;
  toolSearchToolMock: VitestMock;
  UnixLocalSandboxClientMock: VitestMock;
  webSearchToolMock: VitestMock;
}

const chatMockState: ChatMockState = vi.hoisted(() => ({
  agentConstructorMock: vi.fn(),
  codeInterpreterToolMock: vi.fn(),
  connectMcpServersMock: vi.fn(),
  createMCPToolStaticFilterMock: vi.fn((options: { allowed: string[] }) => ({
    allowed: options.allowed,
    kind: "mcp-tool-filter",
  })),
  createAiSdkUiMessageStreamMock: vi.fn(),
  createUiMessageStreamMock: vi.fn(),
  createUiMessageStreamResponseMock: vi.fn(),
  defineOutputGuardrailMock: vi.fn((options: { name: string }) => ({
    kind: "output-guardrail",
    name: options.name,
  })),
  fileSearchToolMock: vi.fn(),
  generateTraceIdMock: vi.fn(),
  handoffMock: vi.fn(),
  imageGenerationToolMock: vi.fn(),
  InputGuardrailTripwireTriggeredMock: class InputGuardrailTripwireTriggeredMock extends Error {
    result: unknown;

    constructor(message: string, result: unknown) {
      super(message);
      this.result = result;
    }
  },
  MemorySessionMock: class MemorySessionMock {
    static nextId = 1;

    items: unknown[];
    sessionId: string;

    constructor(options?: { initialItems?: unknown[]; sessionId?: string }) {
      this.items = options?.initialItems ? [...options.initialItems] : [];
      this.sessionId =
        options?.sessionId ?? `session_demo_${MemorySessionMock.nextId++}`;
    }

    async addItems(items: unknown[]) {
      this.items.push(...items);
    }

    async clearSession() {
      this.items = [];
    }

    async getItems() {
      return [...this.items];
    }

    async getSessionId() {
      return this.sessionId;
    }

    async popItem() {
      return this.items.pop();
    }
  },
  MCPServerStreamableHttpMock: vi
    .fn()
    .mockImplementation(function MockMcpServer(
      this: { name: string; url: string },
      options: { name: string; url: string }
    ) {
      this.name = options.name;
      this.url = options.url;
    }),
  openAiConstructorMock: vi.fn(),
  OutputGuardrailTripwireTriggeredMock: class OutputGuardrailTripwireTriggeredMock extends Error {
    result: unknown;

    constructor(message: string, result: unknown) {
      super(message);
      this.result = result;
    }
  },
  RunStateMock: {
    fromString: vi.fn(),
  },
  runMock: vi.fn(),
  SandboxAgentMock: vi.fn(),
  CapabilitiesMock: {
    default: vi.fn(() => ["filesystem()", "shell()", "compaction()"]),
  },
  ManifestMock: vi.fn(),
  UnixLocalSandboxClientMock: vi.fn(),
  localDirMock: vi.fn(),
  setDefaultOpenAIClientMock: vi.fn(),
  setOpenAIAPIMock: vi.fn(),
  setOpenAIResponsesTransportMock: vi.fn(),
  toolMock: vi.fn(),
  toolSearchToolMock: vi.fn(),
  webSearchToolMock: vi.fn(),
}));

const agentConstructorMock: VitestMock = chatMockState.agentConstructorMock;
const codeInterpreterToolMock: VitestMock =
  chatMockState.codeInterpreterToolMock;
const connectMcpServersMock: VitestMock = chatMockState.connectMcpServersMock;
const createMCPToolStaticFilterMock: VitestMock =
  chatMockState.createMCPToolStaticFilterMock;
const createAiSdkUiMessageStreamMock: VitestMock =
  chatMockState.createAiSdkUiMessageStreamMock;
const createUiMessageStreamMock: VitestMock =
  chatMockState.createUiMessageStreamMock;
const createUiMessageStreamResponseMock: VitestMock =
  chatMockState.createUiMessageStreamResponseMock;
const defineOutputGuardrailMock: VitestMock =
  chatMockState.defineOutputGuardrailMock;
const fileSearchToolMock: VitestMock = chatMockState.fileSearchToolMock;
const generateTraceIdMock: VitestMock = chatMockState.generateTraceIdMock;
const handoffMock: VitestMock = chatMockState.handoffMock;
const imageGenerationToolMock: VitestMock =
  chatMockState.imageGenerationToolMock;
const InputGuardrailTripwireTriggeredMock: GuardrailTripwireTriggeredMock =
  chatMockState.InputGuardrailTripwireTriggeredMock;
const MemorySessionMock: MemorySessionMockConstructor =
  chatMockState.MemorySessionMock;
const MCPServerStreamableHttpMock: VitestMock =
  chatMockState.MCPServerStreamableHttpMock;
const openAiConstructorMock: VitestMock = chatMockState.openAiConstructorMock;
const OutputGuardrailTripwireTriggeredMock: GuardrailTripwireTriggeredMock =
  chatMockState.OutputGuardrailTripwireTriggeredMock;
const RunStateMock: ChatMockState["RunStateMock"] = chatMockState.RunStateMock;
const runMock: VitestMock = chatMockState.runMock;
const SandboxAgentMock: VitestMock = chatMockState.SandboxAgentMock;
const CapabilitiesMock: ChatMockState["CapabilitiesMock"] =
  chatMockState.CapabilitiesMock;
const ManifestMock: VitestMock = chatMockState.ManifestMock;
const UnixLocalSandboxClientMock: VitestMock =
  chatMockState.UnixLocalSandboxClientMock;
const localDirMock: VitestMock = chatMockState.localDirMock;
const setDefaultOpenAIClientMock: VitestMock =
  chatMockState.setDefaultOpenAIClientMock;
const setOpenAIAPIMock: VitestMock = chatMockState.setOpenAIAPIMock;
const setOpenAIResponsesTransportMock: VitestMock =
  chatMockState.setOpenAIResponsesTransportMock;
const toolMock: VitestMock = chatMockState.toolMock;
const toolSearchToolMock: VitestMock = chatMockState.toolSearchToolMock;
const webSearchToolMock: VitestMock = chatMockState.webSearchToolMock;

export {
  agentConstructorMock,
  createAiSdkUiMessageStreamMock,
  createUiMessageStreamMock,
  createUiMessageStreamResponseMock,
  InputGuardrailTripwireTriggeredMock,
  MemorySessionMock,
  OutputGuardrailTripwireTriggeredMock,
  openAiConstructorMock,
  RunStateMock,
  runMock,
  setDefaultOpenAIClientMock,
  setOpenAIAPIMock,
  setOpenAIResponsesTransportMock,
};

vi.mock("@openai/agents", () => ({
  Agent: agentConstructorMock,
  codeInterpreterTool: codeInterpreterToolMock,
  connectMcpServers: connectMcpServersMock,
  createMCPToolStaticFilter: createMCPToolStaticFilterMock,
  defineOutputGuardrail: defineOutputGuardrailMock,
  fileSearchTool: fileSearchToolMock,
  generateTraceId: generateTraceIdMock,
  handoff: handoffMock,
  imageGenerationTool: imageGenerationToolMock,
  InputGuardrailTripwireTriggered: InputGuardrailTripwireTriggeredMock,
  MemorySession: MemorySessionMock,
  MCPServerStreamableHttp: MCPServerStreamableHttpMock,
  OutputGuardrailTripwireTriggered: OutputGuardrailTripwireTriggeredMock,
  RunState: RunStateMock,
  run: runMock,
  setDefaultOpenAIClient: setDefaultOpenAIClientMock,
  setOpenAIAPI: setOpenAIAPIMock,
  setOpenAIResponsesTransport: setOpenAIResponsesTransportMock,
  tool: toolMock,
  toolSearchTool: toolSearchToolMock,
  webSearchTool: webSearchToolMock,
}));

vi.mock("@openai/agents-extensions/ai-sdk-ui", () => ({
  createAiSdkUiMessageStream: createAiSdkUiMessageStreamMock,
}));

vi.mock("@openai/agents/sandbox", () => ({
  Capabilities: CapabilitiesMock,
  Manifest: ManifestMock,
  SandboxAgent: SandboxAgentMock,
  localDir: localDirMock,
}));

vi.mock("@openai/agents/sandbox/local", () => ({
  UnixLocalSandboxClient: UnixLocalSandboxClientMock,
}));

vi.mock("ai", () => ({
  createUIMessageStream: createUiMessageStreamMock,
  createUIMessageStreamResponse: createUiMessageStreamResponseMock,
}));

vi.mock("openai", () => ({
  default: openAiConstructorMock,
}));

export async function importChatModule(): Promise<typeof import("./chat")> {
  return import("./chat");
}

export function resetOpenAiAgentsSdkDemoChatMocks() {
  vi.resetModules();
  resetCoreMocks();
  mockDefaultAgentConstructors();
  mockDefaultHostedTools();
  mockDefaultGatewayClient();
  mockDefaultStreams();
  mockDefaultRunState();
  mockDefaultRunResult();
}

function resetCoreMocks() {
  agentConstructorMock.mockReset();
  codeInterpreterToolMock.mockReset();
  createAiSdkUiMessageStreamMock.mockReset();
  createMCPToolStaticFilterMock.mockClear();
  createUiMessageStreamMock.mockReset();
  createUiMessageStreamResponseMock.mockReset();
  defineOutputGuardrailMock.mockClear();
  fileSearchToolMock.mockReset();
  generateTraceIdMock.mockReset();
  handoffMock.mockReset();
  imageGenerationToolMock.mockReset();
  MemorySessionMock.nextId = 1;
  MCPServerStreamableHttpMock.mockClear();
  openAiConstructorMock.mockReset();
  connectMcpServersMock.mockReset();
  runMock.mockReset();
  SandboxAgentMock.mockReset();
  CapabilitiesMock.default.mockClear();
  ManifestMock.mockReset();
  UnixLocalSandboxClientMock.mockReset();
  localDirMock.mockReset();
  RunStateMock.fromString.mockReset();
  setDefaultOpenAIClientMock.mockReset();
  setOpenAIAPIMock.mockReset();
  setOpenAIResponsesTransportMock.mockReset();
  toolMock.mockReset();
  toolSearchToolMock.mockReset();
  webSearchToolMock.mockReset();
}

function mockDefaultAgentConstructors() {
  agentConstructorMock.mockImplementation(function MockAgent(
    this: {
      asTool: (options: { toolName: string }) => unknown;
      config: Record<string, unknown>;
      handoffDescription: string;
      name: string;
    },
    config: Record<string, unknown>
  ) {
    this.asTool = ({ toolName }) => ({
      kind: "agent-as-tool",
      name: toolName,
    });
    this.config = config;
    this.handoffDescription =
      typeof config.handoffDescription === "string"
        ? config.handoffDescription
        : "";
    this.name = typeof config.name === "string" ? config.name : "Mock Agent";
  });
  SandboxAgentMock.mockImplementation(function MockSandboxAgent(
    this: {
      asTool: (options: { toolName: string }) => unknown;
      config: Record<string, unknown>;
      name: string;
    },
    config: Record<string, unknown>
  ) {
    this.asTool = ({ toolName }) => ({
      kind: "agent-as-tool",
      name: toolName,
    });
    this.config = config;
    this.name =
      typeof config.name === "string" ? config.name : "Mock Sandbox Agent";
  });
  ManifestMock.mockImplementation(function MockManifest(
    this: { config: unknown },
    config: unknown
  ) {
    this.config = config;
  });
  UnixLocalSandboxClientMock.mockImplementation(
    function MockSandboxClient(this: { backendId: string }) {
      this.backendId = "unix_local";
    }
  );
  localDirMock.mockImplementation((options: { src: string }) => ({
    kind: "local-dir",
    src: options.src,
  }));
}

function mockDefaultHostedTools() {
  toolMock.mockImplementation(
    (options: { name: string; needsApproval?: boolean }) => ({
      kind: "function-tool",
      name: options.name,
      needsApproval: options.needsApproval,
    })
  );
  webSearchToolMock.mockReturnValue({
    kind: "hosted-tool",
    name: "web_search",
  });
  codeInterpreterToolMock.mockReturnValue({
    kind: "hosted-tool",
    name: "code_interpreter",
  });
  imageGenerationToolMock.mockReturnValue({
    kind: "hosted-tool",
    name: "image_generation",
  });
  toolSearchToolMock.mockReturnValue({
    kind: "hosted-tool",
    name: "tool_search",
  });
}

function mockDefaultGatewayClient() {
  generateTraceIdMock.mockReturnValue(
    "trace_demo_1234567890abcdef1234567890ab"
  );
  handoffMock.mockImplementation(
    (
      agent: { name: string },
      options: {
        toolDescriptionOverride?: string;
        toolNameOverride?: string;
      }
    ) => ({
      agentName: agent.name,
      kind: "handoff",
      toolDescription: options.toolDescriptionOverride,
      toolName: options.toolNameOverride ?? `transfer_to_${agent.name}`,
    })
  );
  openAiConstructorMock.mockImplementation(function MockOpenAI(
    this: { kind: string; config: unknown },
    config: unknown
  ) {
    this.kind = "gateway-openai-client";
    this.config = config;
  });
}

function mockDefaultStreams() {
  createAiSdkUiMessageStreamMock.mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue({
          finishReason: "stop",
          type: "finish",
        });
        controller.close();
      },
    })
  );
  createUiMessageStreamMock.mockImplementation(({ execute, onError }) => ({
    execute,
    kind: "wrapped-ui-message-stream",
    onError,
  }));
  createUiMessageStreamResponseMock.mockReturnValue(
    Response.json({ ok: true })
  );
  connectMcpServersMock.mockResolvedValue({
    active: [],
    close: vi.fn().mockResolvedValue(undefined),
    errors: new Map(),
    failed: [],
  });
}

function mockDefaultRunState() {
  RunStateMock.fromString.mockReturnValue({
    approve: vi.fn(),
    getInterruptions: vi.fn(() => []),
    reject: vi.fn(),
    toString: vi.fn(() => "serialized-run-state"),
  });
}

function mockDefaultRunResult() {
  runMock.mockResolvedValue({
    completed: Promise.resolve(),
    newItems: [],
  });
}

interface UiMessageStreamOptions {
  execute(input: {
    writer: {
      merge: (stream: ReadableStream<unknown>) => void;
      write: (chunk: unknown) => void;
    };
  }): Promise<void> | void;
  onError(error: unknown): string;
}

export function getLatestUiMessageStreamOptions(): UiMessageStreamOptions {
  const call = createUiMessageStreamMock.mock.calls.at(-1);

  if (!call) {
    throw new Error("Expected createUIMessageStream to be called.");
  }

  return call[0] as UiMessageStreamOptions;
}

interface ExecutedUiMessageStream {
  merge: unknown;
  mergedStream: ReadableStream<unknown> | undefined;
  write: unknown;
}

export async function executeLatestUiMessageStream(): Promise<ExecutedUiMessageStream> {
  const { execute } = getLatestUiMessageStreamOptions();
  const merge = vi.fn();
  const write = vi.fn();

  await execute({
    writer: {
      merge,
      write,
    },
  });

  return {
    merge,
    mergedStream: merge.mock.calls[0]?.[0] as
      | ReadableStream<unknown>
      | undefined,
    write,
  };
}

export async function drainReadableStream(
  stream: ReadableStream<unknown>
): Promise<void> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done } = await reader.read();

      if (done) {
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
