import { describe, expect, it } from "vitest";
import { getOpenAiAgentsSdkDemoRuntimeState } from "./runtime";

describe("openai agents sdk demo runtime state tool catalog", () => {
  it("exposes the configured Tools-guide surface and tool catalog", () => {
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
          label: "Tools",
          observable: "RunToolCallItem / RunToolCallOutputItem",
          providerCapabilityStatus: "available",
          sdkPrimitive: "tool()",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/tools/",
        }),
      ]),
      toolCatalog: expect.arrayContaining([
        expect.objectContaining({
          availability: "configured",
          kind: "function",
          name: "build_research_brief",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "function",
          name: "publish_research_summary",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "function",
          name: "draft_financial_follow_up",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "function",
          name: "build_risk_watchlist",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "hosted",
          name: "web_search",
        }),
        expect.objectContaining({
          availability: "setup-required",
          kind: "hosted",
          name: "file_search",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "hosted",
          name: "code_interpreter",
        }),
        expect.objectContaining({
          availability: "provider-blocked",
          kind: "hosted",
          name: "image_generation",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "hosted",
          name: "tool_search",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "agent-as-tool",
          name: "research_memo_agent",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "agent-as-tool",
          name: "sandbox_workspace_agent",
        }),
      ]),
    });
  });

  it("marks file search configured when vector store ids are provided", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        OPENAI_AGENTS_VECTOR_STORE_IDS: "vs_123, vs_456",
      }).toolCatalog
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          availability: "configured",
          kind: "hosted",
          name: "file_search",
        }),
      ])
    );
  });

  it("marks tool search unavailable on older GPT-5 mini snapshots", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
      }).toolCatalog
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          availability: "setup-required",
          kind: "hosted",
          name: "tool_search",
        }),
        expect.objectContaining({
          availability: "setup-required",
          kind: "function",
          name: "draft_financial_follow_up",
        }),
      ])
    );
  });
});

describe("openai agents sdk demo runtime state integration guides", () => {
  it("exposes the configured Human-in-the-loop guide surface", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Human-in-the-loop",
          observable: "RunToolApprovalItem interruption",
          providerCapabilityStatus: "available",
          sdkPrimitive: "interruptions / approval",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/human-in-the-loop/",
        }),
      ]),
    });
  });

  it("exposes the configured MCP guide surface and local server catalog", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "MCP",
          observable:
            "MCP server connection state + server-prefixed MCP tool call items",
          providerCapabilityStatus: "available",
          sdkPrimitive: "MCPServerStreamableHttp / connectMcpServers",
          sourceGuide: "https://openai.github.io/openai-agents-js/guides/mcp/",
        }),
      ]),
      mcpCatalog: [
        expect.objectContaining({
          name: "openai_agents_demo_docs",
          toolNames: [
            "openai_agents_demo_docs__read_demo_doc",
            "openai_agents_demo_docs__search_demo_docs",
          ],
          transport: "streamable-http",
          urlPath: "/api/demos/openai-agents-sdk-demo/mcp",
        }),
      ],
    });
  });

  it("exposes the configured Sandbox Agents guide surface and runtime profile", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Sandbox Agents",
          observable:
            "SandboxAgent lifecycle + RunConfig.sandbox + persisted sandbox session state",
          providerCapabilityStatus: "available",
          sdkPrimitive: "SandboxAgent / RunConfig.sandbox",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/sandbox-agents/",
        }),
      ]),
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
    });
  });
});
