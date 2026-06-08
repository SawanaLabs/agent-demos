import { describe, expect, it } from "vitest";
import { getOpenAiAgentsSdkDemoRuntimeState } from "./runtime";

describe("openai agents sdk demo runtime state tracing and context guides", () => {
  it("exposes the configured Tracing-guide surface and trace profile", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        OPENAI_AGENTS_DISABLE_TRACING: "1",
        OPENAI_AGENTS_TRACING_API_KEY: "trace-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Tracing",
          observable:
            "workflowName + traceId + groupId + traceMetadata + tracingDisabled",
          providerCapabilityStatus: "available",
          sdkPrimitive: "traceId / groupId / RunConfig.tracing",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/tracing/",
        }),
      ]),
      traceProfile: {
        defaultServerRuntimeTracing: "enabled",
        disableEnvVar: "OPENAI_AGENTS_DISABLE_TRACING",
        exportApiKeySource: "OPENAI_AGENTS_TRACING_API_KEY",
        groupingStrategy: "session-id",
        sdkPrimitives: [
          "generateTraceId",
          "run({ workflowName, traceId, groupId, traceMetadata, tracingDisabled, traceIncludeSensitiveData, tracing })",
        ],
        traceIncludeSensitiveData: true,
        tracingDisabled: true,
        usesPerRunExportOverride: true,
        workflowNameSource: "RunConfig.workflowName",
      },
    });
  });

  it("exposes the configured Sessions-guide surface and session profile", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Sessions",
          observable: "MemorySession history + assistant metadata session id",
          providerCapabilityStatus: "available",
          sdkPrimitive: "MemorySession",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/sessions/",
        }),
      ]),
      sessionProfile: {
        historyStorage: "process-local",
        sdkPrimitive: "MemorySession",
        sessionTransport: "assistant-message metadata",
        supportsCrudHelpers: true,
      },
    });
  });

  it("exposes the configured Context Management guide surface and context profile", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      contextProfile: {
        localContextPrimitive: "RunContext",
        passesContextInto: [
          "dynamic instructions",
          "tool()",
          "guardrails",
          "agent.asTool toolInput",
        ],
        sessionBinding: "session-id",
        suggestedDefaultTarget: "Tesla",
      },
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Context Management",
          observable:
            "RunContext through run(), dynamic instructions, tools, and guardrails",
          providerCapabilityStatus: "available",
          sdkPrimitive: "RunContext<T>",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/context/",
        }),
      ]),
    });
  });
});

describe("openai agents sdk demo runtime state execution guides", () => {
  it("exposes the configured Guardrails-guide surface and catalog", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Guardrails",
          observable: "Guardrail tripwire result",
          providerCapabilityStatus: "available",
          sdkPrimitive: "inputGuardrails / outputGuardrails",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/guardrails/",
        }),
      ]),
      guardrailCatalog: expect.arrayContaining([
        expect.objectContaining({
          availability: "configured",
          kind: "input",
          name: "prompt_scope_guardrail",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "output",
          name: "investment_advice_guardrail",
        }),
      ]),
    });
  });

  it("exposes the configured Running Agents guide surface and run profile", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Running Agents",
          observable:
            "run() + previousResponseId / MemorySession continuation + maxTurns + AbortSignal",
          providerCapabilityStatus: "available",
          sdkPrimitive: "run()",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/running-agents/",
        }),
      ]),
      runProfile: {
        continuationStrategy: "previous-response-id-or-memory-session",
        maxTurns: 8,
        usesRequestSignal: true,
        workflowName: "openai-agents-sdk-demo",
      },
    });
  });

  it("exposes the configured Handoffs guide surface and catalog", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Handoffs",
          observable: "RunHandoffCallItem / RunHandoffOutputItem",
          providerCapabilityStatus: "available",
          sdkPrimitive: "handoff()",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/handoffs/",
        }),
      ]),
      handoffCatalog: expect.arrayContaining([
        expect.objectContaining({
          availability: "configured",
          kind: "agent",
          name: "Market Context Agent",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "handoff",
          name: "Research Lead handoff",
        }),
      ]),
    });
  });

  it("exposes the configured Streaming guide surface", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Streaming",
          observable:
            "RunStreamEvent metadata from raw_model_stream_event, run_item_stream_event, and agent_updated_stream_event",
          providerCapabilityStatus: "available",
          sdkPrimitive: "RunStreamEvent",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/streaming/",
        }),
      ]),
    });
  });
});

describe("openai agents sdk demo runtime state extension and agent guides", () => {
  it("exposes the configured AI SDK Extension guide surface and bridge profile", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      aiSdkExtensionProfile: {
        modelAdapter: {
          sdkPrimitive: "aisdk(model)",
          status: "not-used",
        },
        uiBridge: {
          responseHelper: "createAiSdkUiMessageStreamResponse()",
          sdkPrimitive: "createAiSdkUiMessageStream()",
          status: "configured",
        },
      },
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "AI SDK Extension",
          observable:
            "AI SDK UI stream from createAiSdkUiMessageStream(); aisdk(model) adapter boundary is explicit",
          providerCapabilityStatus: "available",
          sdkPrimitive: "createAiSdkUiMessageStream() / aisdk(model)",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/extensions/ai-sdk/",
        }),
      ]),
    });
  });

  it("exposes the configured Agent Orchestration guide surface", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Agent Orchestration",
          observable:
            "agent.asTool() invocation through a specialist sub-agent",
          providerCapabilityStatus: "available",
          sdkPrimitive: "agent.asTool()",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/multi-agent/",
        }),
      ]),
    });
  });

  it("exposes the configured Results guide surface", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Results",
          observable: "finalOutput, history, newItems, state",
          providerCapabilityStatus: "available",
          sdkPrimitive: "RunResult",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/results/",
        }),
      ]),
    });
  });

  it("exposes developer-verifiable coverage for the official Agents guide", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Agents",
          observable: "Agent instance passed to run()",
          sdkPrimitive: "Agent",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/agents/",
        }),
      ]),
    });
  });
});
