import { createRequire } from "node:module";
import path from "node:path";

import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import type { ToolSet } from "ai";

import {
  closeMcpClients,
  createMcpRuntimeSummary,
  type McpServerSummary,
  type McpToolbox,
  namespaceMcpTools,
} from "./mcp-toolbox";

const requireFromHere = createRequire(import.meta.url);

function resolveNextDevtoolsMcpBin() {
  const packageJsonPath = requireFromHere.resolve(
    "next-devtools-mcp/package.json"
  );

  return path.join(path.dirname(packageJsonPath), "dist/index.js");
}

async function createProjectDocsClient(origin: string) {
  return await createMCPClient({
    clientName: "mcp-agent-project-docs-client",
    transport: {
      type: "http",
      url: new URL("/api/demos/mcp-agent/mcp", origin).toString(),
    },
  });
}

async function createNextRuntimeClient() {
  return await createMCPClient({
    clientName: "mcp-agent-nextjs-runtime-client",
    transport: new Experimental_StdioMCPTransport({
      args: [resolveNextDevtoolsMcpBin()],
      command: process.execPath,
      stderr: "pipe",
    }),
  });
}

async function appendClientTools({
  client,
  clients,
  prefix,
  serverName,
  summaries,
  tools,
  transport,
}: {
  client: MCPClient;
  clients: MCPClient[];
  prefix: string;
  serverName: string;
  summaries: McpServerSummary[];
  tools: ToolSet;
  transport: "http" | "stdio";
}) {
  clients.push(client);
  const rawTools = (await client.tools()) as ToolSet;
  const namespacedTools = namespaceMcpTools(prefix, rawTools);
  const toolNames = Object.keys(namespacedTools);

  Object.assign(tools, namespacedTools);
  summaries.push({
    instructions: client.instructions,
    name: serverName,
    status: "ready",
    toolNames,
    transport,
  });
}

function errorReason(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unknown MCP connection error.";
}

export async function createMcpAgentToolbox({
  origin,
}: {
  origin: string;
}): Promise<McpToolbox> {
  const clients: MCPClient[] = [];
  const summaries: McpServerSummary[] = [];
  const tools: ToolSet = {};

  await appendClientTools({
    client: await createProjectDocsClient(origin),
    clients,
    prefix: "project",
    serverName: "project-docs",
    summaries,
    tools,
    transport: "http",
  });

  try {
    await appendClientTools({
      client: await createNextRuntimeClient(),
      clients,
      prefix: "nextjs",
      serverName: "nextjs-runtime",
      summaries,
      tools,
      transport: "stdio",
    });
  } catch (error) {
    summaries.push({
      name: "nextjs-runtime",
      reason: errorReason(error),
      status: "unavailable",
      toolNames: [],
      transport: "stdio",
    });
  }

  return {
    close: () => closeMcpClients(clients),
    summary: createMcpRuntimeSummary(summaries),
    tools,
  };
}
