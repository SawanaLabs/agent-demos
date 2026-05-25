import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  agentConstructorMock,
  codeInterpreterToolMock,
  createAiSdkUiMessageStreamMock,
  createUiMessageStreamMock,
  createUiMessageStreamResponseMock,
  defineOutputGuardrailMock,
  fileSearchToolMock,
  imageGenerationToolMock,
  InputGuardrailTripwireTriggeredMock,
  openAiConstructorMock,
  OutputGuardrailTripwireTriggeredMock,
  runMock,
  setDefaultOpenAIClientMock,
  setOpenAIAPIMock,
  setOpenAIResponsesTransportMock,
  toolMock,
  toolSearchToolMock,
  webSearchToolMock,
} = vi.hoisted(() => ({
  agentConstructorMock: vi.fn(),
  codeInterpreterToolMock: vi.fn(),
  createAiSdkUiMessageStreamMock: vi.fn(),
  createUiMessageStreamMock: vi.fn(),
  createUiMessageStreamResponseMock: vi.fn(),
  defineOutputGuardrailMock: vi.fn((options: { name: string }) => ({
    kind: "output-guardrail",
    name: options.name,
  })),
  fileSearchToolMock: vi.fn(),
  imageGenerationToolMock: vi.fn(),
  InputGuardrailTripwireTriggeredMock: class InputGuardrailTripwireTriggeredMock extends Error {
    result: unknown;

    constructor(message: string, result: unknown) {
      super(message);
      this.result = result;
    }
  },
  openAiConstructorMock: vi.fn(),
  OutputGuardrailTripwireTriggeredMock: class OutputGuardrailTripwireTriggeredMock extends Error {
    result: unknown;

    constructor(message: string, result: unknown) {
      super(message);
      this.result = result;
    }
  },
  runMock: vi.fn(),
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
  defineOutputGuardrail: defineOutputGuardrailMock,
  fileSearchTool: fileSearchToolMock,
  imageGenerationTool: imageGenerationToolMock,
  InputGuardrailTripwireTriggered: InputGuardrailTripwireTriggeredMock,
  OutputGuardrailTripwireTriggered: OutputGuardrailTripwireTriggeredMock,
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

vi.mock("ai", () => ({
  createUIMessageStream: createUiMessageStreamMock,
  createUIMessageStreamResponse: createUiMessageStreamResponseMock,
}));

vi.mock("openai", () => ({
  default: openAiConstructorMock,
}));

import { streamOpenAiAgentsSdkDemo } from "./chat";

describe("streamOpenAiAgentsSdkDemo", () => {
  beforeEach(() => {
    agentConstructorMock.mockReset();
    codeInterpreterToolMock.mockReset();
    createAiSdkUiMessageStreamMock.mockReset();
    createUiMessageStreamMock.mockReset();
    createUiMessageStreamResponseMock.mockReset();
    defineOutputGuardrailMock.mockClear();
    fileSearchToolMock.mockReset();
    imageGenerationToolMock.mockReset();
    openAiConstructorMock.mockReset();
    runMock.mockReset();
    setDefaultOpenAIClientMock.mockReset();
    setOpenAIAPIMock.mockReset();
    setOpenAIResponsesTransportMock.mockReset();
    toolMock.mockReset();
    toolSearchToolMock.mockReset();
    webSearchToolMock.mockReset();

    agentConstructorMock.mockImplementation(function MockAgent(
      this: { asTool: (options: { toolName: string }) => unknown; config: unknown },
      config: unknown
    ) {
      this.asTool = ({ toolName }) => ({
        kind: "agent-as-tool",
        name: toolName,
      });
      this.config = config;
    });
    toolMock.mockImplementation((options: { name: string }) => ({
      kind: "function-tool",
      name: options.name,
    }));
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
    openAiConstructorMock.mockImplementation(function MockOpenAI(
      this: { kind: string; config: unknown },
      config: unknown
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
    runMock.mockResolvedValue({
      completed: Promise.resolve(),
      newItems: [],
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
      }
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
    expect(agentConstructorMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining("OpenAI Agents SDK demo"),
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
        tools: [
          {
            kind: "function-tool",
            name: "build_research_brief",
          },
          {
            kind: "function-tool",
            name: "draft_financial_follow_up",
          },
          {
            kind: "function-tool",
            name: "build_risk_watchlist",
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
        ],
      })
    );
    expect(
      agentConstructorMock.mock.calls.at(-1)?.[0]?.instructions
    ).toContain(
      "Do not mention internal helper or tool names such as web_search, web.run, code_interpreter, or agent.asTool unless the user explicitly asks how the demo is implemented."
    );
    expect(
      agentConstructorMock.mock.calls.at(-1)?.[0]?.instructions
    ).toContain(
      "Use image_generation for image requests when the user asks for a generated image."
    );
    expect(
      agentConstructorMock.mock.calls.at(-1)?.[0]?.instructions
    ).toContain(
      "The current AI Gateway Responses path cannot return a renderable image_generation artifact to this chat surface."
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
      { stream: true }
    );
    expect(createAiSdkUiMessageStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: expect.any(Promise),
        newItems: [],
      })
    );
    expect(createUiMessageStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        execute: expect.any(Function),
        onError: expect.any(Function),
      })
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
      }
    );

    const [{ execute, onError }] = createUiMessageStreamMock.mock.calls.map(
      ([options]) => options
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
    expect(write).toHaveBeenCalledWith({
      messageMetadata: {
        usedGuideIds: ["tools", "guardrails"],
        usedGuardrailNames: [
          "prompt_scope_guardrail",
          "investment_advice_guardrail",
        ],
        usedToolNames: ["web_search"],
      },
      type: "message-metadata",
    });
    expect(
      onError(new Error("Model 'openai/gpt-5.4-mini' not found"))
    ).toContain("Model 'openai/gpt-5.4-mini' not found");
    expect(onError("plain-string-error")).toBe("The agent stream failed.");
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
      }
    );

    const [{ onError }] = createUiMessageStreamMock.mock.calls
      .slice(-1)
      .map(([options]) => options);

    expect(
      onError(new Error("terminated"))
    ).toContain("image generation is blocked");
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
      })
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
      }
    );

    const [{ execute }] = createUiMessageStreamMock.mock.calls.map(
      ([options]) => options
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
      messageMetadata: {
        usedGuideIds: ["tools"],
        usedToolNames: ["image_generation"],
      },
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
      }
    );

    const [{ onError }] = createUiMessageStreamMock.mock.calls.map(
      ([options]) => options
    );

    expect(
      onError(
        new InputGuardrailTripwireTriggeredMock("blocked", {
          guardrail: {
            name: "prompt_scope_guardrail",
            type: "input",
          },
        })
      )
    ).toContain('Input guardrail "prompt_scope_guardrail" blocked the request');
    expect(
      onError(
        new OutputGuardrailTripwireTriggeredMock("blocked", {
          guardrail: {
            name: "investment_advice_guardrail",
            type: "output",
          },
        })
      )
    ).toContain(
      'Output guardrail "investment_advice_guardrail" blocked the response'
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
      }
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
      })
    );
  });
});
