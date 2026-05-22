import { describe, expect, it } from "vitest";

import { getLoopAgentRuntimeState, handleLoopAgentRequest } from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("loop agent runtime", () => {
  it("uses the loop-agent default chat model in runtime state", () => {
    expect(
      getLoopAgentRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
      }).chatModel
    ).toBe("openai/gpt-5-mini");
  });

  it("returns a setup error before attempting loop work", async () => {
    const response = await handleLoopAgentRequest(
      new Request("http://localhost/api/demos/loop-agent", {
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

  it("rejects invalid request bodies before loop streaming starts", async () => {
    const response = await handleLoopAgentRequest(
      new Request("http://localhost/api/demos/loop-agent", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with a "messages" array.',
    });
  });

  it("streams valid loop-agent requests through the feature streamer", async () => {
    const response = await handleLoopAgentRequest(
      new Request("http://localhost/api/demos/loop-agent", {
        body: JSON.stringify({
          messages: [
            {
              id: "m1",
              parts: [
                {
                  text: "Triage CASE-1842",
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
        streamLoopAgent: async (messages) =>
          Response.json({ messageCount: messages.length }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ messageCount: 1 });
  });
});
