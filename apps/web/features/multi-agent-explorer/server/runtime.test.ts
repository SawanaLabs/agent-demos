import { describe, expect, it, vi } from "vitest";

import {
  getMultiAgentExplorerRuntimeState,
  handleMultiAgentExplorerRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("multi-agent explorer runtime", () => {
  it("maps gateway setup into a page-facing runtime state", () => {
    expect(
      getMultiAgentExplorerRuntimeState({ AI_GATEWAY_API_KEY: "test-key" })
    ).toEqual({
      chatModel: "openai/gpt-5-mini",
      isChatAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("returns a setup error before attempting provider work", async () => {
    const streamMultiAgentExplorer = vi.fn();
    const response = await handleMultiAgentExplorerRequest(
      new Request("http://localhost/api/demos/multi-agent-explorer", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {},
      { streamMultiAgentExplorer }
    );

    expect(response.status).toBe(500);
    expect(streamMultiAgentExplorer).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("rejects malformed JSON and invalid message bodies", async () => {
    const malformedResponse = await handleMultiAgentExplorerRequest(
      new Request("http://localhost/api/demos/multi-agent-explorer", {
        body: "{",
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" }
    );
    const invalidMessagesResponse = await handleMultiAgentExplorerRequest(
      new Request("http://localhost/api/demos/multi-agent-explorer", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" }
    );

    expect(malformedResponse.status).toBe(400);
    await expect(malformedResponse.json()).resolves.toEqual({
      error: "Expected a valid JSON request body.",
    });
    expect(invalidMessagesResponse.status).toBe(400);
    await expect(invalidMessagesResponse.json()).resolves.toEqual({
      error: 'Expected a JSON body with a "messages" array.',
    });
  });

  it("validates messages and streams with the request abort signal", async () => {
    const messages = [
      {
        id: "message-1",
        parts: [
          { text: "Compare fan-out and pipeline patterns", type: "text" },
        ],
        role: "user",
      },
    ];
    const streamMultiAgentExplorer = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }));
    const request = new Request(
      "http://localhost/api/demos/multi-agent-explorer",
      {
        body: JSON.stringify({ messages }),
        method: "POST",
      }
    );

    const response = await handleMultiAgentExplorerRequest(
      request,
      { AI_GATEWAY_API_KEY: "test-key" },
      { streamMultiAgentExplorer }
    );

    expect(response.status).toBe(200);
    expect(streamMultiAgentExplorer).toHaveBeenCalledWith(
      messages,
      { AI_GATEWAY_API_KEY: "test-key" },
      request.signal
    );
  });
});
