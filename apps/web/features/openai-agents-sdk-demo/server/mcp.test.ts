import { describe, expect, it } from "vitest";

import {
  getOpenAiAgentsSdkDemoMcpCatalog,
  getOpenAiAgentsSdkDemoMcpExposedToolNames,
  getOpenAiAgentsSdkDemoMcpProfile,
  getOpenAiAgentsSdkDemoMcpUsageMetadata,
} from "./mcp";

describe("openai agents sdk demo mcp", () => {
  it("exposes the official local streamable-http MCP profile", () => {
    expect(getOpenAiAgentsSdkDemoMcpProfile()).toEqual({
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
    });
    expect(getOpenAiAgentsSdkDemoMcpCatalog()).toEqual([
      expect.objectContaining({
        name: "openai_agents_demo_docs",
        toolNames: getOpenAiAgentsSdkDemoMcpExposedToolNames(),
        transport: "streamable-http",
      }),
    ]);
  });

  it("marks MCP guide usage from prefixed MCP tool calls and records connection state", () => {
    expect(
      getOpenAiAgentsSdkDemoMcpUsageMetadata({
        mcpServers: {
          active: [{ name: "openai_agents_demo_docs" }],
          errors: new Map(),
          failed: [],
        } as never,
        newItems: [
          {
            rawItem: {
              name: "openai_agents_demo_docs__search_demo_docs",
              type: "function_call",
            },
          } as never,
        ],
      })
    ).toEqual({
      mcpSummary: {
        activeServerNames: ["openai_agents_demo_docs"],
        failedServerErrors: [],
        failedServerNames: [],
        usedToolNames: ["openai_agents_demo_docs__search_demo_docs"],
      },
      usedGuideIds: ["mcp"],
    });
  });
});
