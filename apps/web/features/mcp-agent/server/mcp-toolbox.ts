import type { MCPClient } from "@ai-sdk/mcp";
import type { ToolSet } from "ai";

export type McpServerStatus = "ready" | "unavailable";
export type McpTransportKind = "http" | "stdio";

export interface McpServerSummary {
  instructions?: string;
  name: string;
  reason?: string;
  status: McpServerStatus;
  toolNames: string[];
  transport: McpTransportKind;
}

export interface McpRuntimeSummary {
  availableTools: string[];
  servers: McpServerSummary[];
}

export interface McpToolbox {
  close: () => Promise<void>;
  summary: McpRuntimeSummary;
  tools: ToolSet;
}

export function namespaceMcpTools(prefix: string, tools: ToolSet): ToolSet {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [`${prefix}__${name}`, tool])
  );
}

export function createMcpRuntimeSummary(
  servers: McpServerSummary[]
): McpRuntimeSummary {
  return {
    availableTools: servers.flatMap((server) => server.toolNames),
    servers,
  };
}

export function formatMcpRuntimeSummary(summary: McpRuntimeSummary): string {
  return summary.servers
    .map((server) => {
      const header = `${server.name} [${server.status}, ${server.transport}]`;
      const statusLine =
        server.status === "ready"
          ? header
          : `${header}: ${server.reason ?? "Unavailable."}`;
      const toolLines =
        server.toolNames.length > 0
          ? server.toolNames.map((toolName) => `- ${toolName}`).join("\n")
          : "- no tools available";
      const instructions = server.instructions
        ? `\nInstructions: ${server.instructions}`
        : "";

      return `${statusLine}${instructions}\nTools:\n${toolLines}`;
    })
    .join("\n\n");
}

export async function closeMcpClients(clients: MCPClient[]) {
  await Promise.allSettled(clients.map((client) => client.close()));
}
