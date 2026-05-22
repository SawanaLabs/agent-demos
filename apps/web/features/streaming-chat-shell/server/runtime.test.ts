import { describe, expect, it } from "vitest";

import {
  getStreamingChatShellRuntimeState,
  handleStreamingChatShellRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("streaming chat shell runtime", () => {
  it("maps shared gateway setup into a streaming-shell runtime state", () => {
    expect(
      getStreamingChatShellRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
      })
    ).toEqual({
      chatModel: "openai/gpt-4.1-mini",
      isChatAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
      supportedAudiences: ["engineers", "buyers", "support"],
    });
  });

  it("keeps setup errors inside the streaming-shell runtime shape", () => {
    expect(getStreamingChatShellRuntimeState({})).toMatchObject({
      isChatAvailable: false,
      setupMessage: expect.stringMatching(missingGatewayKeyPattern),
      statusLabel: "Setup required",
    });
  });

  it("returns a setup error before attempting chat work", async () => {
    const response = await handleStreamingChatShellRequest(
      new Request("http://localhost/api/demos/streaming-chat-shell", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("rejects invalid request bodies at the runtime seam", async () => {
    const response = await handleStreamingChatShellRequest(
      new Request("http://localhost/api/demos/streaming-chat-shell", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamStreamingChatShell: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with a "messages" array.',
    });
  });

  it("passes request-level audience configuration into the chat streamer", async () => {
    const response = await handleStreamingChatShellRequest(
      new Request("http://localhost/api/demos/streaming-chat-shell", {
        body: JSON.stringify({
          audience: "buyers",
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "Explain this product briefly." }],
            },
          ],
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamStreamingChatShell: async (messages, env, options) =>
          Response.json({
            audience: options.audience,
            messageCount: messages.length,
          }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      audience: "buyers",
      messageCount: 1,
    });
  });
});
