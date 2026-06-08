import type { UIMessage } from "ai";
import { beforeEach, expect, it } from "vitest";

import {
  agentConstructorMock,
  createAiSdkUiMessageStreamMock,
  createUiMessageStreamMock,
  createUiMessageStreamResponseMock,
  importChatModule,
  MemorySessionMock,
  openAiConstructorMock,
  resetOpenAiAgentsSdkDemoChatMocks,
  runMock,
  setDefaultOpenAIClientMock,
  setOpenAIAPIMock,
  setOpenAIResponsesTransportMock,
} from "./chat-test-fixtures";

beforeEach(resetOpenAiAgentsSdkDemoChatMocks);

it("configures the official Agents run path and AI SDK UI response bridge", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();
  const response = await streamOpenAiAgentsSdkDemo(createRunPathMessages(), {
    AI_GATEWAY_API_KEY: "gateway-key",
    AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
  });

  expect(response.status).toBe(200);
  expectGatewayClientConfigured();
  const mainAgentConfig = getMainAgentConfig();

  expectMainAgentConfig(mainAgentConfig);
  expectMainAgentInstructions(mainAgentConfig);
  expectDefaultRunInvocation();
  expectUiBridgeConfigured();
});

it("continues later turns with previousResponseId instead of replaying assistant text", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  await streamOpenAiAgentsSdkDemo(createPreviousResponseMessages(), {
    AI_GATEWAY_API_KEY: "gateway-key",
  });

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
    })
  );
});

it("prefers the demo-specific model override when it is present", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

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

function createRunPathMessages(): UIMessage[] {
  return [
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
  ];
}

function createPreviousResponseMessages(): UIMessage[] {
  return [
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
  ];
}

function expectGatewayClientConfigured() {
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
}

function getMainAgentConfig(): Record<string, unknown> {
  const config = agentConstructorMock.mock.calls
    .map(([agentConfig]) => agentConfig)
    .find(
      (agentConfig) =>
        typeof agentConfig === "object" &&
        agentConfig !== null &&
        "name" in agentConfig &&
        agentConfig.name === "OpenAI Agents SDK Demo"
    );

  if (!(typeof config === "object" && config !== null)) {
    throw new Error("Expected the main OpenAI Agents SDK demo agent config.");
  }

  return config as Record<string, unknown>;
}

function expectMainAgentConfig(mainAgentConfig: Record<string, unknown>) {
  expect(mainAgentConfig).toMatchObject({
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
    toolUseBehavior: "run_llm_again",
  });
  expect(mainAgentConfig.inputGuardrails).toEqual([
    expect.objectContaining({
      name: "prompt_scope_guardrail",
      runInParallel: false,
    }),
  ]);
  expect(mainAgentConfig.outputGuardrails).toEqual([
    expect.objectContaining({
      name: "investment_advice_guardrail",
    }),
  ]);
  expect(mainAgentConfig.handoffs).toEqual([
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
  ]);
  expect(mainAgentConfig.tools).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: "function-tool",
        name: "build_research_brief",
      }),
      expect.objectContaining({
        kind: "function-tool",
        name: "publish_research_summary",
      }),
      expect.objectContaining({
        kind: "function-tool",
        name: "draft_financial_follow_up",
      }),
      expect.objectContaining({
        kind: "function-tool",
        name: "build_risk_watchlist",
      }),
      expect.objectContaining({ kind: "hosted-tool", name: "web_search" }),
      expect.objectContaining({
        kind: "hosted-tool",
        name: "code_interpreter",
      }),
      expect.objectContaining({
        kind: "hosted-tool",
        name: "image_generation",
      }),
      expect.objectContaining({ kind: "hosted-tool", name: "tool_search" }),
      expect.objectContaining({
        kind: "agent-as-tool",
        name: "research_memo_agent",
      }),
      expect.objectContaining({
        kind: "agent-as-tool",
        name: "sandbox_workspace_agent",
      }),
    ])
  );
}

function expectMainAgentInstructions(mainAgentConfig: Record<string, unknown>) {
  const instructions = mainAgentConfig.instructions;

  if (typeof instructions !== "function") {
    throw new Error("Expected main agent instructions to be a function.");
  }

  const instructionText = (instructions as (...args: unknown[]) => string)(
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
    }
  );

  for (const expectedText of [
    "Do not mention internal helper or tool names",
    "Use image_generation for image requests",
    "For a brief web-search summary, use the hosted web_search tool directly",
    "Use build_research_brief only at the start of an investment research",
    "Use a handoff when one specialist should take over the conversation directly.",
    "default to Tesla",
    "The current AI Gateway Responses path cannot return a renderable image_generation artifact to this chat surface.",
  ]) {
    expect(instructionText).toContain(expectedText);
  }
}

function expectDefaultRunInvocation() {
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
    })
  );
}

function expectUiBridgeConfigured() {
  expect(createAiSdkUiMessageStreamMock).toHaveBeenCalledWith(
    expect.objectContaining({
      [Symbol.asyncIterator]: expect.any(Function),
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
}
