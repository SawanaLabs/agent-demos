import { describe, expect, it, vi } from "vitest";

import {
  getMinimalChatAgentRuntimeState,
  handleMinimalChatAgentRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("minimal chat agent runtime", () => {
  it("maps gateway setup into a page-facing runtime state", () => {
    expect(
      getMinimalChatAgentRuntimeState({ AI_GATEWAY_API_KEY: "test-key" })
    ).toEqual({
      chatModel: "openai/gpt-5-mini",
      isChatAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("returns a setup error before attempting provider work", async () => {
    const streamMinimalChatAgent = vi.fn();
    const response = await handleMinimalChatAgentRequest(
      new Request("http://localhost/api/demos/minimal-chat-agent", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {},
      { streamMinimalChatAgent }
    );

    expect(response.status).toBe(500);
    expect(streamMinimalChatAgent).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("rejects malformed JSON and invalid message bodies", async () => {
    const malformedResponse = await handleMinimalChatAgentRequest(
      new Request("http://localhost/api/demos/minimal-chat-agent", {
        body: "{",
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" }
    );
    const invalidMessagesResponse = await handleMinimalChatAgentRequest(
      new Request("http://localhost/api/demos/minimal-chat-agent", {
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
        parts: [{ text: "Inspect shadcn-ui/chatbot-template", type: "text" }],
        role: "user",
      },
    ];
    const streamMinimalChatAgent = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }));
    const request = new Request(
      "http://localhost/api/demos/minimal-chat-agent",
      {
        body: JSON.stringify({ messages }),
        method: "POST",
      }
    );

    const response = await handleMinimalChatAgentRequest(
      request,
      { AI_GATEWAY_API_KEY: "test-key" },
      { streamMinimalChatAgent }
    );

    expect(response.status).toBe(200);
    expect(streamMinimalChatAgent).toHaveBeenCalledWith(
      messages,
      { AI_GATEWAY_API_KEY: "test-key" },
      request.signal
    );
  });
});
