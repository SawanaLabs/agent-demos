import { describe, expect, it } from "vitest";

import {
  getFoundationChatRuntimeState,
  handleFoundationChatRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("foundation chat runtime", () => {
  it("maps feature-local gateway setup into a feature-local runtime state", () => {
    expect(
      getFoundationChatRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-nano",
      })
    ).toEqual({
      chatModel: "openai/gpt-4.1-nano",
      isChatAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("keeps setup errors inside the foundation chat runtime shape", () => {
    expect(getFoundationChatRuntimeState({})).toMatchObject({
      isChatAvailable: false,
      setupMessage: expect.stringMatching(missingGatewayKeyPattern),
      statusLabel: "Setup required",
    });
  });

  it("returns a setup error before attempting chat work", async () => {
    const response = await handleFoundationChatRequest(
      new Request("http://localhost/api/demos/foundation-chat", {
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
    const response = await handleFoundationChatRequest(
      new Request("http://localhost/api/demos/foundation-chat", {
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
});
