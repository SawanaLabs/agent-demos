import { describe, expect, it, vi } from "vitest";

import {
  getGenerativeUiRuntimeState,
  handleGenerativeUiRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("generative UI runtime", () => {
  it("maps feature-local gateway setup into runtime state", () => {
    expect(
      getGenerativeUiRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
        GENERATIVE_UI_CHAT_MODEL: "openai/gpt-5",
      })
    ).toEqual({
      chatModel: "openai/gpt-5",
      isChatAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("returns a setup error before attempting chat work", async () => {
    const streamGenerativeUiChat = vi.fn();
    const response = await handleGenerativeUiRequest(
      new Request("http://localhost/api/demos/generative-ui", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {},
      { streamGenerativeUiChat }
    );

    expect(response.status).toBe(500);
    expect(streamGenerativeUiChat).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("rejects invalid request bodies at the runtime seam", async () => {
    const response = await handleGenerativeUiRequest(
      new Request("http://localhost/api/demos/generative-ui", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with a "messages" array.',
    });
  });

  it("streams through the injected chat dependency after validating messages", async () => {
    const messages = [
      {
        id: "message-1",
        parts: [
          { text: "Compare current AI coding assistants.", type: "text" },
        ],
        role: "user",
      },
    ];
    const streamGenerativeUiChat = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }));

    const response = await handleGenerativeUiRequest(
      new Request("http://localhost/api/demos/generative-ui", {
        body: JSON.stringify({ messages }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      { streamGenerativeUiChat }
    );

    expect(response.status).toBe(200);
    expect(streamGenerativeUiChat).toHaveBeenCalledWith(messages, {
      AI_GATEWAY_API_KEY: "test-key",
    });
  });
});
