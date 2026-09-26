import { describe, expect, it, vi } from "vitest";

import { getEveAgentRuntimeState, handleEveAgentRequest } from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

const readyEveSupport = () =>
  Promise.resolve({ module: {}, status: "ready" as const });

describe("eve agent runtime", () => {
  it("maps gateway and eve setup into a page-facing runtime state", async () => {
    const runtimeState = await getEveAgentRuntimeState(
      { AI_GATEWAY_API_KEY: "test-key" },
      readyEveSupport
    );

    expect(runtimeState).toEqual({
      chatModel: "openai/gpt-5-mini",
      eveStatus: "ready",
      isChatAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("returns a setup error before attempting provider work", async () => {
    const streamEveAgent = vi.fn();
    const response = await handleEveAgentRequest(
      new Request("http://localhost/api/demos/eve-agent", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {},
      { streamEveAgent }
    );

    expect(response.status).toBe(500);
    expect(streamEveAgent).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("rejects malformed JSON and invalid message bodies", async () => {
    const malformedResponse = await handleEveAgentRequest(
      new Request("http://localhost/api/demos/eve-agent", {
        body: "{",
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      { resolveEveSupport: readyEveSupport }
    );
    const invalidMessagesResponse = await handleEveAgentRequest(
      new Request("http://localhost/api/demos/eve-agent", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      { resolveEveSupport: readyEveSupport }
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
        parts: [{ text: "Is billing affected by an incident?", type: "text" }],
        role: "user",
      },
    ];
    const streamEveAgent = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }));
    const request = new Request("http://localhost/api/demos/eve-agent", {
      body: JSON.stringify({ messages }),
      method: "POST",
    });

    const response = await handleEveAgentRequest(
      request,
      { AI_GATEWAY_API_KEY: "test-key" },
      { resolveEveSupport: readyEveSupport, streamEveAgent }
    );

    expect(response.status).toBe(200);
    expect(streamEveAgent).toHaveBeenCalledWith(
      messages,
      { AI_GATEWAY_API_KEY: "test-key" },
      request.signal
    );
  });
});
