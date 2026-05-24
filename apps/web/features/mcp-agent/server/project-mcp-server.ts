// biome-ignore lint/correctness/noUnresolvedImports: the MCP SDK wildcard export requires the .js subpath at runtime.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// biome-ignore lint/correctness/noUnresolvedImports: the MCP SDK wildcard export requires the .js subpath at runtime.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

import { demoPatterns, demoStatuses } from "@/features/demo-catalog/types";
import {
  listDemoCatalogForMcp,
  readDemoDocsForMcp,
  searchProjectDocsForMcp,
} from "./project-tools";

const jsonText = (value: unknown) => ({
  content: [
    {
      text: JSON.stringify(value, null, 2),
      type: "text" as const,
    },
  ],
});

export function createProjectDocsMcpServer() {
  const server = new McpServer(
    {
      name: "mcp-agent-project-docs",
      title: "MCP Agent Project Docs",
      version: "0.1.0",
    },
    {
      instructions:
        "Use these tools for repository docs, demo catalog, and AI SDK recipes checklist questions.",
    }
  );

  server.registerTool(
    "list_demos",
    {
      description:
        "List demo catalog entries, optionally filtered by status or pattern.",
      inputSchema: {
        pattern: z.enum(demoPatterns).optional(),
        status: z.enum(demoStatuses).optional(),
      },
    },
    ({ pattern, status }) =>
      jsonText(listDemoCatalogForMcp({ pattern, status }))
  );

  server.registerTool(
    "read_demo_docs",
    {
      description:
        "Read durable docs and the feature README for one demo slug when present.",
      inputSchema: {
        slug: z.string().min(1),
      },
    },
    async ({ slug }) => jsonText(await readDemoDocsForMcp({ slug }))
  );

  server.registerTool(
    "search_project_docs",
    {
      description: "Search durable project docs for line-level matches.",
      inputSchema: {
        limit: z.number().int().min(1).max(30).optional(),
        query: z.string().min(1),
      },
    },
    async ({ limit, query }) =>
      jsonText(await searchProjectDocsForMcp({ limit, query }))
  );

  return server;
}

export async function handleProjectDocsMcpRequest(request: Request) {
  const server = createProjectDocsMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
}
