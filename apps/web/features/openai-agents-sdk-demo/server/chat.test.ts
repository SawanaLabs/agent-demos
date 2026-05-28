import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  agentConstructorMock,
  codeInterpreterToolMock,
  connectMcpServersMock,
  createMCPToolStaticFilterMock,
  createAiSdkUiMessageStreamMock,
  createUiMessageStreamMock,
  createUiMessageStreamResponseMock,
  defineOutputGuardrailMock,
  fileSearchToolMock,
  generateTraceIdMock,
  handoffMock,
  imageGenerationToolMock,
  InputGuardrailTripwireTriggeredMock,
  MemorySessionMock,
  MCPServerStreamableHttpMock,
  openAiConstructorMock,
  OutputGuardrailTripwireTriggeredMock,
  RunStateMock,
  runMock,
  SandboxAgentMock,
  CapabilitiesMock,
  ManifestMock,
  UnixLocalSandboxClientMock,
  localDirMock,
  setDefaultOpenAIClientMock,
  setOpenAIAPIMock,
  setOpenAIResponsesTransportMock,
  toolMock,
  toolSearchToolMock,
  webSearchToolMock,
} = vi.hoisted(() => ({
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
      options: { name: string; url: string },
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

import { streamOpenAiAgentsSdkDemo } from "./chat";

async function drainReadableStream(stream: ReadableStream<unknown>) {
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

describe("streamOpenAiAgentsSdkDemo", () => {
  beforeEach(() => {
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

    agentConstructorMock.mockImplementation(function MockAgent(
      this: {
        asTool: (options: { toolName: string }) => unknown;
        config: Record<string, unknown>;
        handoffDescription: string;
        name: string;
      },
      config: Record<string, unknown>,
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
      config: Record<string, unknown>,
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
      config: unknown,
    ) {
      this.config = config;
    });
    UnixLocalSandboxClientMock.mockImplementation(
      function MockSandboxClient(this: { backendId: string }) {
        this.backendId = "unix_local";
      },
    );
    localDirMock.mockImplementation((options: { src: string }) => ({
      kind: "local-dir",
      src: options.src,
    }));
    toolMock.mockImplementation(
      (options: { name: string; needsApproval?: boolean }) => ({
        kind: "function-tool",
        name: options.name,
        needsApproval: options.needsApproval,
      }),
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
    generateTraceIdMock.mockReturnValue(
      "trace_demo_1234567890abcdef1234567890ab",
    );
    handoffMock.mockImplementation(
      (
        agent: { name: string },
        options: {
          toolDescriptionOverride?: string;
          toolNameOverride?: string;
        },
      ) => ({
        agentName: agent.name,
        kind: "handoff",
        toolDescription: options.toolDescriptionOverride,
        toolName: options.toolNameOverride ?? `transfer_to_${agent.name}`,
      }),
    );
    toolSearchToolMock.mockReturnValue({
      kind: "hosted-tool",
      name: "tool_search",
    });
    openAiConstructorMock.mockImplementation(function MockOpenAI(
      this: { kind: string; config: unknown },
      config: unknown,
    ) {
      this.kind = "gateway-openai-client";
      this.config = config;
    });
    createAiSdkUiMessageStreamMock.mockReturnValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue({
            finishReason: "stop",
            type: "finish",
          });
          controller.close();
        },
      }),
    );
    createUiMessageStreamMock.mockImplementation(({ execute, onError }) => ({
      execute,
      kind: "wrapped-ui-message-stream",
      onError,
    }));
    createUiMessageStreamResponseMock.mockReturnValue(
      Response.json({ ok: true }),
    );
    connectMcpServersMock.mockResolvedValue({
      active: [],
      close: vi.fn().mockResolvedValue(undefined),
      errors: new Map(),
      failed: [],
    });
    runMock.mockResolvedValue({
      completed: Promise.resolve(),
      newItems: [],
    });
    RunStateMock.fromString.mockReturnValue({
      approve: vi.fn(),
      getInterruptions: vi.fn(() => []),
      reject: vi.fn(),
      toString: vi.fn(() => "serialized-run-state"),
    });
  });

  it("configures the official OpenAI Agents run path against AI Gateway and returns the official AI SDK UI response bridge", async () => {
    const response = await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "Give me a crisp plan.", type: "text" }],
          role: "user",
        },
        {
          id: "a1",
          parts: [{ text: "Plan draft.", type: "text" }],
          role: "assistant",
        },
        {
          id: "u2",
          parts: [{ text: "Now tighten it.", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      },
    );

    expect(response.status).toBe(200);
    expect(setOpenAIAPIMock).toHaveBeenCalledWith("responses");
    expect(setOpenAIResponsesTransportMock).toHaveBeenCalledWith("http");
    expect(openAiConstructorMock).toHaveBeenCalledWith({
      apiKey: "gateway-key",
      baseURL: "https://ai-gateway.vercel.sh/v1",
    });
    expect(setDefaultOpenAIClientMock).toHaveBeenCalledWith({
      config: {
        apiKey: "gateway-key",
        baseURL: "https://ai-gateway.vercel.sh/v1",
      },
      kind: "gateway-openai-client",
    });
    const mainAgentConfig = agentConstructorMock.mock.calls
      .map(([config]) => config)
      .find(
        (config) =>
          typeof config === "object" &&
          config !== null &&
          config.name === "OpenAI Agents SDK Demo",
      );

    expect(mainAgentConfig).toMatchObject(
      expect.objectContaining({
        instructions: expect.any(Function),
        model: "openai/gpt-5.4-mini",
        modelSettings: {
          reasoning: {
            effort: "medium",
          },
          text: {
            verbosity: "low",
          },
        },
        name: "OpenAI Agents SDK Demo",
        inputGuardrails: [
          expect.objectContaining({
            name: "prompt_scope_guardrail",
            runInParallel: false,
          }),
        ],
        outputGuardrails: [
          expect.objectContaining({
            name: "investment_advice_guardrail",
          }),
        ],
        handoffs: [
          expect.objectContaining({
            config: expect.objectContaining({
              name: "Market Context Agent",
            }),
            handoffDescription:
              "Use this specialist when the user needs direct market context, company history, or competitive framing.",
            name: "Market Context Agent",
          }),
          {
            agentName: "Research Lead Agent",
            kind: "handoff",
            toolDescription:
              "Transfer to the research lead when the specialist should answer directly with a research synthesis or next-step plan.",
            toolName: "transfer_to_research_lead",
          },
        ],
        toolUseBehavior: "run_llm_again",
        tools: expect.arrayContaining([
          {
            kind: "function-tool",
            name: "build_research_brief",
            needsApproval: undefined,
          },
          {
            kind: "function-tool",
            name: "publish_research_summary",
            needsApproval: true,
          },
          {
            kind: "function-tool",
            name: "draft_financial_follow_up",
            needsApproval: undefined,
          },
          {
            kind: "function-tool",
            name: "build_risk_watchlist",
            needsApproval: undefined,
          },
          {
            kind: "hosted-tool",
            name: "web_search",
          },
          {
            kind: "hosted-tool",
            name: "code_interpreter",
          },
          {
            kind: "hosted-tool",
            name: "image_generation",
          },
          {
            kind: "hosted-tool",
            name: "tool_search",
          },
          {
            kind: "agent-as-tool",
            name: "research_memo_agent",
          },
          {
            kind: "agent-as-tool",
            name: "sandbox_workspace_agent",
          },
        ]),
      }),
    );
    const instructions = mainAgentConfig?.instructions as
      | ((...args: unknown[]) => string)
      | undefined;

    expect(
      instructions?.(
        {
          context: {
            defaultResearchTarget: "Tesla",
            latestUserPrompt: "Research a public company for me.",
            latestUserPromptPreview: "Research a public company for me.",
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
            sessionKind: "MemorySession",
          },
        },
        {
          name: "OpenAI Agents SDK Demo",
        },
      ),
    ).toContain("Do not mention internal helper or tool names");
    expect(
      instructions?.(
        {
          context: {
            defaultResearchTarget: "Tesla",
            latestUserPrompt: "Research a public company for me.",
            latestUserPromptPreview: "Research a public company for me.",
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
            sessionKind: "MemorySession",
          },
        },
        {
          name: "OpenAI Agents SDK Demo",
        },
      ),
    ).toContain("Use image_generation for image requests");
    expect(
      instructions?.(
        {
          context: {
            defaultResearchTarget: "Tesla",
            latestUserPrompt: "Research a public company for me.",
            latestUserPromptPreview: "Research a public company for me.",
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
            sessionKind: "MemorySession",
          },
        },
        {
          name: "OpenAI Agents SDK Demo",
        },
      ),
    ).toContain(
      "For a brief web-search summary, use the hosted web_search tool directly",
    );
    expect(
      instructions?.(
        {
          context: {
            defaultResearchTarget: "Tesla",
            latestUserPrompt: "Research a public company for me.",
            latestUserPromptPreview: "Research a public company for me.",
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
            sessionKind: "MemorySession",
          },
        },
        {
          name: "OpenAI Agents SDK Demo",
        },
      ),
    ).toContain(
      "Use build_research_brief only at the start of an investment research",
    );
    expect(
      instructions?.(
        {
          context: {
            defaultResearchTarget: "Tesla",
            latestUserPrompt: "Research a public company for me.",
            latestUserPromptPreview: "Research a public company for me.",
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
            sessionKind: "MemorySession",
          },
        },
        {
          name: "OpenAI Agents SDK Demo",
        },
      ),
    ).toContain(
      "Use a handoff when one specialist should take over the conversation directly.",
    );
    expect(
      instructions?.(
        {
          context: {
            defaultResearchTarget: "Tesla",
            latestUserPrompt: "Research a public company for me.",
            latestUserPromptPreview: "Research a public company for me.",
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
            sessionKind: "MemorySession",
          },
        },
        {
          name: "OpenAI Agents SDK Demo",
        },
      ),
    ).toContain("default to Tesla");
    expect(
      instructions?.(
        {
          context: {
            defaultResearchTarget: "Tesla",
            latestUserPrompt: "Research a public company for me.",
            latestUserPromptPreview: "Research a public company for me.",
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
            sessionKind: "MemorySession",
          },
        },
        {
          name: "OpenAI Agents SDK Demo",
        },
      ),
    ).toContain(
      "The current AI Gateway Responses path cannot return a renderable image_generation artifact to this chat surface.",
    );
    expect(runMock).toHaveBeenCalledWith(
      expect.anything(),
      [
        {
          content: "Give me a crisp plan.",
          role: "user",
        },
        {
          content: [{ text: "Plan draft.", type: "output_text" }],
          role: "assistant",
          status: "completed",
        },
        {
          content: "Now tighten it.",
          role: "user",
        },
      ],
      expect.objectContaining({
        context: {
          defaultResearchTarget: "Tesla",
          latestUserPrompt: "Now tighten it.",
          latestUserPromptPreview: "Now tighten it.",
          researchMode: "general",
          sessionId: "session_demo_1",
          sessionKind: "MemorySession",
        },
        groupId: "session_demo_1",
        maxTurns: 8,
        session: expect.any(MemorySessionMock),
        sandbox: expect.objectContaining({
          client: expect.anything(),
        }),
        stream: true,
        traceId: "trace_demo_1234567890abcdef1234567890ab",
        traceIncludeSensitiveData: true,
        traceMetadata: {
          demo: "openai-agents-sdk-demo",
          session_id: "session_demo_1",
        },
        tracingDisabled: false,
        workflowName: "openai-agents-sdk-demo",
      }),
    );
    expect(createAiSdkUiMessageStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        [Symbol.asyncIterator]: expect.any(Function),
      }),
    );
    expect(createUiMessageStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        execute: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(createUiMessageStreamResponseMock).toHaveBeenCalledWith({
      stream: expect.objectContaining({
        kind: "wrapped-ui-message-stream",
      }),
    });
  });

  it("surfaces stream errors through the AI SDK UI error handler", async () => {
    runMock.mockResolvedValueOnce({
      completed: Promise.resolve(),
      inputGuardrailResults: [
        {
          guardrail: {
            name: "prompt_scope_guardrail",
            type: "input",
          },
        },
      ],
      lastResponseId: "resp_demo_123",
      newItems: [
        {
          rawItem: {
            name: "web_search_call",
            type: "hosted_tool_call",
          },
        },
      ],
      outputGuardrailResults: [
        {
          guardrail: {
            name: "investment_advice_guardrail",
            type: "output",
          },
        },
      ],
    });

    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "Trigger an error path.", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    const [{ execute, onError }] = createUiMessageStreamMock.mock.calls.map(
      ([options]) => options,
    );
    const merge = vi.fn();
    const write = vi.fn();

    await execute({
      writer: {
        merge,
        write,
      },
    });

    expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
    const mergedGuardrailStream = merge.mock.calls[0]?.[0];

    expect(mergedGuardrailStream).toBeInstanceOf(ReadableStream);
    await drainReadableStream(mergedGuardrailStream as ReadableStream<unknown>);
    expect(write).toHaveBeenCalledWith({
      messageMetadata: expect.objectContaining({
        aiSdkExtensionSummary: {
          modelAdapterStatus: "not-used",
          uiBridgeStatus: "configured",
          usedBridgePrimitive: "createAiSdkUiMessageStream()",
        },
        lastResponseId: "resp_demo_123",
        resultSummary: expect.objectContaining({
          hasResumableState: false,
          newItemsCount: 1,
          rawResponseCount: 0,
        }),
        sessionSummary: expect.objectContaining({
          historyItemCount: 0,
          sessionKind: "MemorySession",
          storageScope: "process-local",
        }),
        traceSummary: expect.objectContaining({
          exportApiKeySource: "missing",
          groupId: "session_demo_1",
          metadataKeys: ["demo", "session_id"],
          traceId: "trace_demo_1234567890abcdef1234567890ab",
          traceIncludeSensitiveData: true,
          tracingDisabled: false,
          workflowName: "openai-agents-sdk-demo",
        }),
        usedGuideIds: expect.arrayContaining([
          "running-agents",
          "results",
          "sessions",
          "tracing",
          "tools",
          "guardrails",
          "extensions-ai-sdk",
        ]),
        usedGuardrailNames: [
          "prompt_scope_guardrail",
          "investment_advice_guardrail",
        ],
        usedToolNames: ["web_search"],
      }),
      type: "message-metadata",
    });
    expect(
      onError(new Error("Model 'openai/gpt-5.4-mini' not found")),
    ).toContain("Model 'openai/gpt-5.4-mini' not found");
    expect(
      onError(
        new Error("400 At least one user message is required in the input"),
      ),
    ).toContain(
      "AI Gateway rejected the OpenAI Agents SDK function-tool continuation request",
    );
    expect(onError("plain-string-error")).toBe("The agent stream failed.");
  });

  it("captures official stream events and returns a streaming summary to the UI", async () => {
    createAiSdkUiMessageStreamMock.mockImplementationOnce(
      (source: AsyncIterable<unknown>) =>
        new ReadableStream({
          async start(controller) {
            for await (const _event of source) {
              // Consume the observed stream so metadata can be collected.
            }

            controller.enqueue({
              finishReason: "stop",
              type: "finish",
            });
            controller.close();
          },
        }),
    );
    runMock.mockResolvedValueOnce({
      completed: Promise.resolve(),
      lastResponseId: "resp_stream_123",
      newItems: [],
      async *[Symbol.asyncIterator]() {
        yield {
          agent: {
            name: "Research Memo Agent",
          },
          type: "agent_updated_stream_event",
        };
        yield {
          data: {
            type: "response.output_text.delta",
          },
          source: "openai-responses",
          type: "raw_model_stream_event",
        };
        yield {
          item: {
            rawItem: {
              type: "function_call",
            },
          },
          name: "tool_called",
          type: "run_item_stream_event",
        };
      },
    });

    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "Stream something useful.", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    const [{ execute }] = createUiMessageStreamMock.mock.calls
      .slice(-1)
      .map(([options]) => options);
    const merge = vi.fn();
    const write = vi.fn();

    await execute({
      writer: {
        merge,
        write,
      },
    });

    expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
    const mergedStreamingStream = merge.mock.calls[0]?.[0];

    expect(mergedStreamingStream).toBeInstanceOf(ReadableStream);
    await drainReadableStream(mergedStreamingStream as ReadableStream<unknown>);
    expect(write).toHaveBeenCalledWith({
      messageMetadata: expect.objectContaining({
        lastResponseId: "resp_stream_123",
        resultSummary: expect.objectContaining({
          hasResumableState: false,
          rawResponseCount: 0,
        }),
        sessionSummary: expect.objectContaining({
          sessionKind: "MemorySession",
          storageScope: "process-local",
        }),
        streamSummary: {
          agentNames: ["Research Memo Agent"],
          rawModelEventCount: 1,
          rawModelEventTypes: ["response.output_text.delta"],
          rawModelSources: ["openai-responses"],
          runItemEventCount: 1,
          runItemEventNames: ["tool_called"],
        },
        usedGuideIds: expect.arrayContaining([
          "running-agents",
          "streaming",
          "results",
          "sessions",
        ]),
      }),
      type: "message-metadata",
    });
  });

  it("persists settled RunResult surfaces into result metadata after completion", async () => {
    runMock.mockResolvedValueOnce({
      activeAgent: {
        name: "Research Lead Agent",
      },
      completed: Promise.resolve(),
      finalOutput: {
        summary: "Tesla gross margin pressure remains the key open issue.",
      },
      history: [{ role: "user" }, { role: "assistant" }],
      interruptions: [],
      lastAgent: {
        name: "Research Lead Agent",
      },
      lastResponseId: "resp_results_123",
      newItems: [{ rawItem: { type: "message_output_item" } }],
      output: [{ type: "message_output_item" }],
      rawResponses: [{ id: "resp_raw_1", output: [] }],
      state: {
        usage: {
          inputTokens: 321,
          outputTokens: 123,
          requests: 2,
          totalTokens: 444,
        },
      },
    });

    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "Summarize Tesla margins.", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    const [{ execute }] = createUiMessageStreamMock.mock.calls
      .slice(-1)
      .map(([options]) => options);
    const merge = vi.fn();
    const write = vi.fn();

    await execute({
      writer: {
        merge,
        write,
      },
    });

    expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
    const mergedResultsStream = merge.mock.calls[0]?.[0];

    expect(mergedResultsStream).toBeInstanceOf(ReadableStream);
    await drainReadableStream(mergedResultsStream as ReadableStream<unknown>);
    expect(write).toHaveBeenCalledWith({
      messageMetadata: expect.objectContaining({
        lastResponseId: "resp_results_123",
        resultSummary: {
          activeAgentName: "Research Lead Agent",
          finalOutputPreview:
            '{"summary":"Tesla gross margin pressure remains the key open issue."}',
          hasResumableState: true,
          historyLength: 2,
          inputTokens: 321,
          interruptionCount: 0,
          lastAgentName: "Research Lead Agent",
          newItemsCount: 1,
          outputCount: 1,
          outputTokens: 123,
          rawResponseCount: 1,
          requestCount: 2,
          totalTokens: 444,
        },
        sessionSummary: expect.objectContaining({
          sessionKind: "MemorySession",
          storageScope: "process-local",
        }),
        usedGuideIds: expect.arrayContaining([
          "running-agents",
          "results",
          "sessions",
        ]),
      }),
      type: "message-metadata",
    });
  });

  it("continues later turns with previousResponseId instead of replaying lossy assistant text history", async () => {
    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "Research Tesla first.", type: "text" }],
          role: "user",
        },
        {
          id: "a1",
          metadata: {
            lastResponseId: "resp_prev_456",
            sessionSummary: {
              historyItemCount: 2,
              sessionId: "session_prev_1",
              sessionKind: "MemorySession",
              storageScope: "process-local",
            },
          },
          parts: [
            { text: "Initial research complete.", type: "text" },
            {
              input: '{company:"Tesla"}',
              output: "done",
              state: "output-available",
              toolCallId: "tool_1",
              toolName: "build_research_brief",
              type: "dynamic-tool",
            },
          ],
          role: "assistant",
        },
        {
          id: "u2",
          parts: [{ text: "Now compare the key risks.", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    expect(runMock).toHaveBeenLastCalledWith(
      expect.anything(),
      [
        {
          content: "Now compare the key risks.",
          role: "user",
        },
      ],
      expect.objectContaining({
        context: {
          defaultResearchTarget: "Tesla",
          latestUserPrompt: "Now compare the key risks.",
          latestUserPromptPreview: "Now compare the key risks.",
          researchMode: "general",
          sessionId: "session_prev_1",
          sessionKind: "MemorySession",
        },
        groupId: "session_prev_1",
        maxTurns: 8,
        previousResponseId: "resp_prev_456",
        session: expect.objectContaining({
          sessionId: "session_prev_1",
        }),
        sandbox: expect.objectContaining({
          client: expect.anything(),
        }),
        stream: true,
        traceId: "trace_demo_1234567890abcdef1234567890ab",
        traceIncludeSensitiveData: true,
        traceMetadata: {
          demo: "openai-agents-sdk-demo",
          session_id: "session_prev_1",
        },
        tracingDisabled: false,
        workflowName: "openai-agents-sdk-demo",
      }),
    );
  });

  it("serializes paused RunState metadata when a tool approval interruption is returned", async () => {
    runMock.mockResolvedValueOnce({
      completed: Promise.resolve(),
      interruptions: [
        {
          agent: {
            name: "OpenAI Agents SDK Demo",
          },
          arguments: {
            audience: "investment committee",
            company: "Tesla",
            summary: "Gross margin pressure still needs sign-off.",
          },
          rawItem: {
            callId: "call_approval_1",
            id: "approval_1",
          },
          toolName: "publish_research_summary",
        },
      ],
      lastResponseId: "resp_hitl_123",
      newItems: [],
      state: {
        toString: () => "serialized-run-state",
        usage: {
          requests: 1,
        },
      },
    });

    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [
            {
              text: "Share the Tesla conclusion with the investment committee.",
              type: "text",
            },
          ],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    const [{ execute }] = createUiMessageStreamMock.mock.calls
      .slice(-1)
      .map(([options]) => options);
    const merge = vi.fn();
    const write = vi.fn();

    await execute({
      writer: {
        merge,
        write,
      },
    });

    expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
    const mergedApprovalStream = merge.mock.calls[0]?.[0];

    expect(mergedApprovalStream).toBeInstanceOf(ReadableStream);
    await drainReadableStream(mergedApprovalStream as ReadableStream<unknown>);
    expect(write).toHaveBeenCalledWith({
      messageMetadata: expect.objectContaining({
        approvalSummary: {
          decisions: [],
          hasPendingApprovals: true,
          pendingApprovals: [
            {
              agentName: "OpenAI Agents SDK Demo",
              approvalId: "approval_1",
              argumentsPreview:
                '{"audience":"investment committee","company":"Tesla","summary":"Gross margin pressure still needs sign-off."}',
              toolCallId: "call_approval_1",
              toolName: "publish_research_summary",
            },
          ],
          serializedRunState: "serialized-run-state",
        },
        lastResponseId: "resp_hitl_123",
        resultSummary: expect.objectContaining({
          hasResumableState: true,
          interruptionCount: 1,
        }),
        usedGuideIds: expect.arrayContaining([
          "running-agents",
          "human-in-the-loop",
          "results",
          "sessions",
        ]),
        usedToolNames: ["publish_research_summary"],
      }),
      type: "message-metadata",
    });
  });

  it("resumes a paused run from serialized RunState after an approval response", async () => {
    const interruption = {
      agent: {
        name: "OpenAI Agents SDK Demo",
      },
      arguments: {
        audience: "investment committee",
        company: "Tesla",
        summary: "Gross margin pressure still needs sign-off.",
      },
      rawItem: {
        callId: "call_approval_1",
        id: "approval_1",
      },
      toolName: "publish_research_summary",
    };
    const approve = vi.fn();
    const reject = vi.fn();
    const getInterruptions = vi.fn(() => [interruption]);
    const resumedState = {
      approve,
      getInterruptions,
      reject,
      toString: vi.fn(() => "serialized-run-state"),
    };

    RunStateMock.fromString.mockReturnValueOnce(resumedState);
    runMock.mockResolvedValueOnce({
      completed: Promise.resolve(),
      lastResponseId: "resp_resume_123",
      newItems: [
        {
          output: "shared",
          rawItem: {
            callId: "call_approval_1",
            name: "publish_research_summary",
            output: "shared",
            type: "function_call",
          },
        },
      ],
      output: ["shared"],
      state: {
        toString: () => "resumed-run-state",
        usage: {
          requests: 2,
        },
      },
    });

    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [
            {
              text: "Share the Tesla conclusion with the investment committee.",
              type: "text",
            },
          ],
          role: "user",
        },
        {
          id: "a1",
          metadata: {
            approvalSummary: {
              decisions: [],
              hasPendingApprovals: true,
              pendingApprovals: [
                {
                  approvalId: "approval_1",
                  toolCallId: "call_approval_1",
                  toolName: "publish_research_summary",
                },
              ],
              serializedRunState: "serialized-run-state",
            },
          },
          parts: [
            {
              approval: {
                approved: true,
                id: "approval_1",
                reason: "Reviewer approved the request.",
              },
              input: {
                audience: "investment committee",
                company: "Tesla",
                summary: "Gross margin pressure still needs sign-off.",
              },
              state: "approval-responded",
              toolCallId: "call_approval_1",
              toolName: "publish_research_summary",
              type: "dynamic-tool",
            },
          ],
          role: "assistant",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    expect(RunStateMock.fromString).toHaveBeenCalledWith(
      expect.anything(),
      "serialized-run-state",
    );
    expect(approve).toHaveBeenCalledWith(interruption);
    expect(reject).not.toHaveBeenCalled();
    expect(runMock).toHaveBeenLastCalledWith(
      expect.anything(),
      resumedState,
      expect.objectContaining({
        maxTurns: 8,
        session: expect.any(MemorySessionMock),
        sandbox: expect.objectContaining({
          client: expect.anything(),
        }),
        stream: true,
      }),
    );

    const [{ execute }] = createUiMessageStreamMock.mock.calls
      .slice(-1)
      .map(([options]) => options);
    const merge = vi.fn();
    const write = vi.fn();

    await execute({
      writer: {
        merge,
        write,
      },
    });

    expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
    const mergedResumedStream = merge.mock.calls[0]?.[0];

    expect(mergedResumedStream).toBeInstanceOf(ReadableStream);
    await drainReadableStream(mergedResumedStream as ReadableStream<unknown>);
    expect(write).toHaveBeenCalledWith({
      messageMetadata: expect.objectContaining({
        approvalSummary: {
          decisions: [
            {
              approvalId: "approval_1",
              approved: true,
              reason: "Reviewer approved the request.",
            },
          ],
          hasPendingApprovals: false,
          pendingApprovals: [],
        },
        lastResponseId: "resp_resume_123",
        usedGuideIds: expect.arrayContaining([
          "running-agents",
          "human-in-the-loop",
          "results",
          "sessions",
          "tools",
        ]),
        usedToolNames: ["publish_research_summary"],
      }),
      type: "message-metadata",
    });
  });

  it("blocks a normal user turn while a tool approval is still pending", async () => {
    await expect(
      streamOpenAiAgentsSdkDemo(
        [
          {
            id: "a1",
            metadata: {
              approvalSummary: {
                decisions: [],
                hasPendingApprovals: true,
                pendingApprovals: [
                  {
                    approvalId: "approval_1",
                    toolCallId: "call_approval_1",
                    toolName: "publish_research_summary",
                  },
                ],
                serializedRunState: "serialized-run-state",
              },
            },
            parts: [
              {
                approval: {
                  id: "approval_1",
                },
                input: {
                  audience: "investment committee",
                  company: "Tesla",
                  summary: "Gross margin pressure still needs sign-off.",
                },
                state: "approval-requested",
                toolCallId: "call_approval_1",
                toolName: "publish_research_summary",
                type: "dynamic-tool",
              },
            ],
            role: "assistant",
          },
          {
            id: "u1",
            parts: [{ text: "continue", type: "text" }],
            role: "user",
          },
        ],
        {
          AI_GATEWAY_API_KEY: "gateway-key",
        },
      ),
    ).rejects.toThrow("A tool approval is pending");

    expect(runMock).not.toHaveBeenCalled();
  });

  it("maps terminated image-generation streams to an explicit provider block", async () => {
    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "生成一张图片，随机。", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    const [{ onError }] = createUiMessageStreamMock.mock.calls
      .slice(-1)
      .map(([options]) => options);

    expect(onError(new Error("terminated"))).toContain(
      "image generation is blocked",
    );
  });

  it("adds generated image files to the UI stream when image_generation completes", async () => {
    createAiSdkUiMessageStreamMock.mockReturnValueOnce(
      new ReadableStream({
        start(controller) {
          controller.enqueue({
            messageId: "message-1",
            type: "start",
          });
          controller.enqueue({
            dynamic: true,
            toolCallId: "ig_123",
            toolName: "image_generation",
            type: "tool-input-start",
          });
          controller.enqueue({
            finishReason: "stop",
            type: "finish",
          });
          controller.close();
        },
      }),
    );
    runMock.mockResolvedValueOnce({
      completed: Promise.resolve(),
      newItems: [
        {
          rawItem: {
            id: "ig_123",
            result: "ZmFrZS1pbWFnZQ==",
            status: "completed",
            type: "image_generation_call",
          },
        },
      ],
    });

    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "生成一张图片，随机。", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    const [{ execute }] = createUiMessageStreamMock.mock.calls.map(
      ([options]) => options,
    );
    let mergedStream: ReadableStream | undefined;
    const write = vi.fn();

    await execute({
      writer: {
        merge(stream: ReadableStream) {
          mergedStream = stream;
        },
        write,
      },
    });

    expect(mergedStream).toBeDefined();

    const reader = mergedStream!.getReader();
    const chunks: unknown[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
    }

    expect(chunks).toEqual([
      {
        messageId: "message-1",
        type: "start",
      },
      {
        dynamic: true,
        toolCallId: "ig_123",
        toolName: "image_generation",
        type: "tool-input-start",
      },
      {
        mediaType: "image/png",
        type: "file",
        url: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
      },
      {
        finishReason: "stop",
        type: "finish",
      },
    ]);
    expect(write).toHaveBeenCalledWith({
      messageMetadata: expect.objectContaining({
        contextSummary: {
          defaultResearchTarget: "Tesla",
          latestUserPromptPreview: "生成一张图片，随机。",
          localContextKind: "RunContext",
          researchMode: "general",
          sessionId: "session_demo_1",
          sessionKind: "MemorySession",
        },
        resultSummary: {
          hasResumableState: false,
          historyLength: 0,
          inputTokens: 0,
          interruptionCount: 0,
          newItemsCount: 1,
          outputCount: 0,
          outputTokens: 0,
          rawResponseCount: 0,
          requestCount: 0,
          totalTokens: 0,
        },
        sessionSummary: expect.objectContaining({
          sessionKind: "MemorySession",
          storageScope: "process-local",
        }),
        usedGuideIds: expect.arrayContaining([
          "results",
          "context",
          "sessions",
          "tools",
        ]),
        usedToolNames: ["image_generation"],
      }),
      type: "message-metadata",
    });
  });

  it("maps guardrail tripwires to explicit chat errors", async () => {
    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "Trigger a guardrail path.", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
      },
    );

    const [{ onError }] = createUiMessageStreamMock.mock.calls.map(
      ([options]) => options,
    );

    expect(
      onError(
        new InputGuardrailTripwireTriggeredMock("blocked", {
          guardrail: {
            name: "prompt_scope_guardrail",
            type: "input",
          },
        }),
      ),
    ).toContain('Input guardrail "prompt_scope_guardrail" blocked the request');
    expect(
      onError(
        new OutputGuardrailTripwireTriggeredMock("blocked", {
          guardrail: {
            name: "investment_advice_guardrail",
            type: "output",
          },
        }),
      ),
    ).toContain(
      'Output guardrail "investment_advice_guardrail" blocked the response',
    );
  });

  it("prefers the demo-specific model override when it is present", async () => {
    await streamOpenAiAgentsSdkDemo(
      [
        {
          id: "u1",
          parts: [{ text: "Use the narrow override.", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "anthropic/claude-sonnet-4.5",
        OPENAI_AGENTS_MODEL: "openai/gpt-5.4-mini",
        OPENAI_AGENTS_REASONING_EFFORT: "high",
      },
    );

    expect(agentConstructorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-5.4-mini",
        modelSettings: {
          reasoning: {
            effort: "high",
          },
          text: {
            verbosity: "low",
          },
        },
      }),
    );
  });
});
