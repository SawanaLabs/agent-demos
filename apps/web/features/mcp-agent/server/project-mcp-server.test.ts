import { describe, expect, it } from "vitest";

import { handleProjectDocsMcpRequest } from "./project-mcp-server";

function mcpRequest(method: string, params: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/demos/mcp-agent/mcp", {
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    method: "POST",
  });
}

describe("project docs MCP server", () => {
  it("initializes through the streamable HTTP transport", async () => {
    const response = await handleProjectDocsMcpRequest(
      mcpRequest("initialize", {
        capabilities: {},
        clientInfo: {
          name: "vitest-client",
          version: "0.0.0",
        },
        protocolVersion: "2025-06-18",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: 1,
      jsonrpc: "2.0",
      result: {
        serverInfo: {
          name: "mcp-agent-project-docs",
        },
      },
    });
  });
});
