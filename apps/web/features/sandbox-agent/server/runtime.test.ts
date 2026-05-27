import { describe, expect, it } from "vitest";

import { handleSandboxAgentRequest } from "./request";
import { getSandboxAgentRuntimeState } from "./runtime";

const missingSetupErrorPattern = /AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN/i;

describe("sandbox-agent runtime", () => {
  it("surfaces the preview-first runtime state when setup is ready", async () => {
    const runtimeState = await getSandboxAgentRuntimeState({
      AI_GATEWAY_API_KEY: "test-key",
      VERCEL_OIDC_TOKEN: "test-oidc-token",
    });

    expect(runtimeState.chatModel).toBe("openai/gpt-5-mini");
    expect(runtimeState.previewPort).toBe(3000);
    expect(runtimeState.statusLabel).toBe("Ready");
  });

  it("returns a setup error before attempting sandbox-agent work", async () => {
    const response = await handleSandboxAgentRequest(
      new Request("http://localhost/api/demos/sandbox-agent", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingSetupErrorPattern),
    });
  });

  it("rejects invalid request bodies before streaming starts", async () => {
    const response = await handleSandboxAgentRequest(
      new Request("http://localhost/api/demos/sandbox-agent", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        VERCEL_OIDC_TOKEN: "test-oidc-token",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with an "id" string and a "messages" array.',
    });
  });

  it("passes valid requests into the sandbox-agent streamer", async () => {
    const response = await handleSandboxAgentRequest(
      new Request("http://localhost/api/demos/sandbox-agent", {
        body: JSON.stringify({
          id: "chat-123",
          messages: [
            {
              id: "m1",
              parts: [
                {
                  text: "Build a pricing landing page with an interactive calculator.",
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
        VERCEL_OIDC_TOKEN: "test-oidc-token",
      },
      {
        streamSandboxAgent: async (messages, options) =>
          Response.json({
            messageCount: messages.length,
            previewPort: options.previewPort,
            sessionId: options.sessionId,
          }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      messageCount: 1,
      previewPort: 3000,
      sessionId: "chat-123",
    });
  });
});
