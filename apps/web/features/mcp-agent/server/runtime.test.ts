import { describe, expect, it } from "vitest";

import { getMcpAgentRuntimeState, handleMcpAgentRequest } from "./runtime";

const missingSetupErrorPattern = /AI_GATEWAY_API_KEY/i;

describe("mcp-agent runtime", () => {
  it("surfaces the static MCP runtime contract when setup is ready", () => {
    const runtimeState = getMcpAgentRuntimeState({
      AI_GATEWAY_API_KEY: "test-key",
    });

    expect(runtimeState.chatModel).toBe("openai/gpt-5-mini");
    expect(runtimeState.configuredServers.map((server) => server.name)).toEqual(
      ["project-docs", "nextjs-runtime"]
    );
    expect(runtimeState.statusLabel).toBe("Ready");
  });

  it("returns a setup error before attempting MCP agent work", async () => {
    const response = await handleMcpAgentRequest(
      new Request("http://localhost/api/demos/mcp-agent", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingSetupErrorPattern),
    });
  });

  it("passes valid requests into the feature streamer with request origin", async () => {
    const response = await handleMcpAgentRequest(
      new Request("http://localhost:3000/api/demos/mcp-agent", {
        body: JSON.stringify({
          id: "chat-123",
          messages: [
            {
              id: "m1",
              parts: [
                {
                  text: "Check project docs and runtime errors.",
                  type: "text",
                },
              ],
              role: "user",
            },
          ],
        }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
      },
      {
        streamMcpAgent: async (messages, options) =>
          Response.json({
            messageCount: messages.length,
            origin: options.origin,
          }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      messageCount: 1,
      origin: "http://localhost:3000",
    });
  });
});
