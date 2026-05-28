import { readFile } from "node:fs/promises";
// biome-ignore lint/correctness/noUnresolvedImports: the MCP SDK wildcard export requires the .js subpath at runtime.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// biome-ignore lint/correctness/noUnresolvedImports: the MCP SDK wildcard export requires the .js subpath at runtime.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

import {
  OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME,
  openAiAgentsSdkDemoMcpToolNames,
} from "./mcp";

const frontendDocUrl = new URL(
  "../../../../../docs/frontend/openai-agents-sdk-demo.md",
  import.meta.url
);
const featureReadmeUrl = new URL("../README.md", import.meta.url);

const demoDocIds = ["feature-readme", "frontend-doc"] as const;

function jsonText(value: unknown) {
  return {
    content: [
      {
        text: JSON.stringify(value, null, 2),
        type: "text" as const,
      },
    ],
  };
}

async function getDemoDocSources() {
  return [
    {
      id: "feature-readme" as const,
      label: "apps/web/features/openai-agents-sdk-demo/README.md",
      text: await readFile(featureReadmeUrl, "utf8"),
    },
    {
      id: "frontend-doc" as const,
      label: "docs/frontend/openai-agents-sdk-demo.md",
      text: await readFile(frontendDocUrl, "utf8"),
    },
  ];
}

async function readDemoDoc(document: (typeof demoDocIds)[number]) {
  const sources = await getDemoDocSources();
  const source = sources.find((item) => item.id === document);

  if (!source) {
    throw new Error(`Unknown demo document: ${document}`);
  }

  return {
    document: source.id,
    label: source.label,
    text: source.text,
  };
}

async function searchDemoDocs({
  limit = 6,
  query,
}: {
  limit?: number;
  query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const sources = await getDemoDocSources();
  const matches: Array<{
    document: string;
    line: number;
    text: string;
  }> = [];

  for (const source of sources) {
    const lines = source.text.split("\n");

    for (let index = 0; index < lines.length; index += 1) {
      const lineText = lines[index]?.trim() ?? "";

      if (!lineText.toLowerCase().includes(normalizedQuery)) {
        continue;
      }

      matches.push({
        document: source.label,
        line: index + 1,
        text: lineText,
      });

      if (matches.length >= limit) {
        return matches;
      }
    }
  }

  return matches;
}

export function createOpenAiAgentsSdkDemoMcpServer() {
  const server = new McpServer(
    {
      name: OPENAI_AGENTS_SDK_DEMO_MCP_SERVER_NAME,
      title: "OpenAI Agents SDK Demo Docs",
      version: "0.1.0",
    },
    {
      instructions:
        "Use these tools when the user asks about this demo's README, durable frontend doc, setup contract, or official guide coverage notes.",
    }
  );

  server.registerTool(
    openAiAgentsSdkDemoMcpToolNames[0],
    {
      description:
        "Read one durable document for the OpenAI Agents SDK demo feature slice.",
      inputSchema: {
        document: z.enum(demoDocIds),
      },
    },
    async ({ document }) => jsonText(await readDemoDoc(document))
  );

  server.registerTool(
    openAiAgentsSdkDemoMcpToolNames[1],
    {
      description:
        "Search the OpenAI Agents SDK demo README and durable frontend doc for line-level matches.",
      inputSchema: {
        limit: z.number().int().min(1).max(20).optional(),
        query: z.string().min(1),
      },
    },
    async ({ limit, query }) => jsonText(await searchDemoDocs({ limit, query }))
  );

  return server;
}

export async function handleOpenAiAgentsSdkDemoMcpRequest(request: Request) {
  const server = createOpenAiAgentsSdkDemoMcpServer();
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
