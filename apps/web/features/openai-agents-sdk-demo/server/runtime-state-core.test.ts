import { describe, expect, it } from "vitest";
import { getOpenAiAgentsSdkDemoRuntimeState } from "./runtime";

describe("openai agents sdk demo runtime state core setup", () => {
  it("defaults the demo model to openai/gpt-5-mini", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      aiSdkExtensionProfile: {
        modelAdapter: {
          notes:
            "Official docs recommend the default OpenAI provider for OpenAI models, and the beta aisdk() model adapter does not support deferred Responses tool loading.",
          sdkPrimitive: "aisdk(model)",
          status: "not-used",
        },
        uiBridge: {
          responseHelper: "createAiSdkUiMessageStreamResponse()",
          sdkPrimitive: "createAiSdkUiMessageStream()",
          status: "configured",
        },
      },
      chatModel: "openai/gpt-5-mini",
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
      modelProfile: expect.objectContaining({
        model: "openai/gpt-5-mini",
      }),
      mcpProfile: {
        convertSchemasToStrict: true,
        lifecycle: "connectMcpServers",
        routePath: "/api/demos/openai-agents-sdk-demo/mcp",
        sdkPrimitives: [
          "MCPServerStreamableHttp",
          "connectMcpServers",
          "Agent.mcpServers",
          "Agent.mcpConfig",
        ],
        serverName: "openai_agents_demo_docs",
        toolNamePrefixing: true,
        transport: "streamable-http",
      },
      runProfile: expect.objectContaining({
        continuationStrategy: "previous-response-id-or-memory-session",
        maxTurns: 8,
        usesRequestSignal: true,
        workflowName: "openai-agents-sdk-demo",
      }),
      sandboxProfile: {
        agentModel: "openai/gpt-5.4-mini",
        clientBackend: "unix_local",
        defaultCapabilities: ["filesystem()", "shell()", "compaction()"],
        manifestRoot: "/workspace",
        mountedPaths: ["/workspace/docs", "/workspace/feature"],
        sdkPrimitives: [
          "SandboxAgent",
          "Manifest",
          "Capabilities.default()",
          "UnixLocalSandboxClient",
          "RunConfig.sandbox",
        ],
        sessionPersistence: "session-id -> process-local sessionState",
        workspaceSource: "localDir() -> temp workspace",
      },
      sessionProfile: {
        historyStorage: "process-local",
        sdkPrimitive: "MemorySession",
        sessionTransport: "assistant-message metadata",
        supportsCrudHelpers: true,
      },
      traceProfile: {
        defaultServerRuntimeTracing: "enabled",
        disableEnvVar: "OPENAI_AGENTS_DISABLE_TRACING",
        exportApiKeySource: "missing",
        groupingStrategy: "session-id",
        sdkPrimitives: [
          "generateTraceId",
          "run({ workflowName, traceId, groupId, traceMetadata, tracingDisabled, traceIncludeSensitiveData, tracing })",
        ],
        traceIncludeSensitiveData: true,
        tracingDisabled: false,
        usesPerRunExportOverride: true,
        workflowNameSource: "RunConfig.workflowName",
      },
    });
  });

  it("reports the configured AI Gateway chat model when setup is complete", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5.4-mini",
      })
    ).toMatchObject({
      chatModel: "openai/gpt-5.4-mini",
      isChatAvailable: true,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("exposes the active Models-guide configuration and diagnostics", () => {
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
          label: "Models",
          observable:
            "Agent modelSettings.reasoning + text.verbosity on the responses API path",
          providerCapabilityStatus: "available",
          sdkPrimitive: "model, modelSettings",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/models/",
        }),
      ]),
      modelProfile: {
        api: "responses",
        baseUrl: "https://ai-gateway.vercel.sh/v1",
        model: "openai/gpt-5.4-mini",
        provider: "gateway-openai-client",
        reasoningEffort: "medium",
        responsesTransport: "http",
        textVerbosity: "low",
      },
    });
  });
});
