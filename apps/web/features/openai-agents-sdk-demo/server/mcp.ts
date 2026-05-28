import {
  connectMcpServers,
  createMCPToolStaticFilter,
  MCPServerStreamableHttp,
  type MCPServers,
  type RunItem,
} from "@openai/agents";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

export const OPENAI_AGENTS_SDK_DEMO_MCP_ROUTE_PATH =
  "/api/demos/openai-agents-sdk-demo/mcp";
export const OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME = "openai_agents_demo_docs";
export const openAiAgentsSdkDemoMcpToolNames = [
  "read_demo_doc",
  "search_demo_docs",
] as const;

export const openAiAgentsSdkDemoMcpSummarySchema = z.object({
  activeServerNames: z.array(z.string()),
  failedServerErrors: z.array(z.string()),
  failedServerNames: z.array(z.string()),
  usedToolNames: z.array(z.string()),
});

export interface OpenAiAgentsSdkDemoMcpProfile {
  convertSchemasToStrict: true;
  lifecycle: "connectMcpServers";
  routePath: typeof OPENAI_AGENTS_SDK_DEMO_MCP_ROUTE_PATH;
  sdkPrimitives: [
    "MCPServerStreamableHttp",
    "connectMcpServers",
    "Agent.mcpServers",
    "Agent.mcpConfig",
  ];
  serverName: typeof OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME;
  toolNamePrefixing: true;
  transport: "streamable-http";
}

export interface OpenAiAgentsSdkDemoMcpCatalogEntry {
  name: string;
  notes: string;
  toolNames: string[];
  transport: "streamable-http";
  urlPath: string;
}

function getMcpToolName(rawItem: { name?: string; type?: string }) {
  if (
    rawItem.type === "function_call" ||
    rawItem.type === "function_call_result"
  ) {
    return rawItem.name ?? null;
  }

  return null;
}

function getFailedServerErrorMessages(mcpServers: MCPServers) {
  return mcpServers.failed.map((server) => {
    const error = mcpServers.errors.get(server);

    return error
      ? `${server.name}: ${error.message}`
      : `${server.name}: failed`;
  });
}

export function getOpenAiAgentsSdkDemoMcpExposedToolNames() {
  return openAiAgentsSdkDemoMcpToolNames.map(
    (toolName) => `${OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME}__${toolName}`
  );
}

export function isOpenAiAgentsSdkDemoMcpToolName(name: string) {
  return getOpenAiAgentsSdkDemoMcpExposedToolNames().includes(name);
}

export function getOpenAiAgentsSdkDemoMcpProfile(): OpenAiAgentsSdkDemoMcpProfile {
  return {
    convertSchemasToStrict: true,
    lifecycle: "connectMcpServers",
    routePath: OPENAI_AGENTS_SDK_DEMO_MCP_ROUTE_PATH,
    sdkPrimitives: [
      "MCPServerStreamableHttp",
      "connectMcpServers",
      "Agent.mcpServers",
      "Agent.mcpConfig",
    ],
    serverName: OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME,
    toolNamePrefixing: true,
    transport: "streamable-http",
  };
}

export function getOpenAiAgentsSdkDemoMcpCatalog(): OpenAiAgentsSdkDemoMcpCatalogEntry[] {
  return [
    {
      name: OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME,
      notes:
        "Demo-local Streamable HTTP MCP server that exposes this feature slice's README and durable frontend doc through official MCP tools.",
      toolNames: getOpenAiAgentsSdkDemoMcpExposedToolNames(),
      transport: "streamable-http",
      urlPath: OPENAI_AGENTS_SDK_DEMO_MCP_ROUTE_PATH,
    },
  ];
}

export async function connectOpenAiAgentsSdkDemoMcpServers({
  origin,
}: {
  origin: string;
}) {
  const server = new MCPServerStreamableHttp({
    cacheToolsList: true,
    errorFunction: ({ error }) =>
      error instanceof Error
        ? `MCP tool call failed: ${error.message}`
        : "MCP tool call failed.",
    name: OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME,
    toolFilter: createMCPToolStaticFilter({
      allowed: [...openAiAgentsSdkDemoMcpToolNames],
    }),
    url: new URL(OPENAI_AGENTS_SDK_DEMO_MCP_ROUTE_PATH, origin).toString(),
  });

  return await connectMcpServers([server], {
    connectInParallel: true,
  });
}

export function getOpenAiAgentsSdkDemoMcpUsageMetadata({
  mcpServers,
  newItems,
}: {
  mcpServers: MCPServers;
  newItems: RunItem[];
}): OpenAiAgentsSdkDemoMessageMetadata | undefined {
  const usedToolNames = Array.from(
    new Set(
      newItems
        .map((item) =>
          getMcpToolName(
            (item.rawItem ?? {}) as { name?: string; type?: string }
          )
        )
        .filter(
          (value): value is string =>
            value !== null && isOpenAiAgentsSdkDemoMcpToolName(value)
        )
    )
  );
  const hasConnectionMetadata =
    mcpServers.active.length > 0 || mcpServers.failed.length > 0;

  if (!hasConnectionMetadata && usedToolNames.length === 0) {
    return;
  }

  return {
    mcpSummary: {
      activeServerNames: mcpServers.active.map((server) => server.name),
      failedServerErrors: getFailedServerErrorMessages(mcpServers),
      failedServerNames: mcpServers.failed.map((server) => server.name),
      usedToolNames,
    },
    ...(usedToolNames.length > 0 ? { usedGuideIds: ["mcp"] } : {}),
  };
}
