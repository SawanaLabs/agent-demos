import { describe, expect, it } from "vitest";

import { handleStreamingChatShellEventsRequest } from "./events";

describe("streaming chat shell custom stream", () => {
  it("rejects invalid request bodies before building the custom stream", async () => {
    const response = await handleStreamingChatShellEventsRequest(
      new Request("http://localhost/api/demos/streaming-chat-shell/events", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamStreamingChatShellEvents: async function* () {
          yield { type: "text", text: "hello" } as const;
        },
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with a "messages" array.',
    });
  });

  it("returns a text/event-stream response with custom event payloads", async () => {
    const response = await handleStreamingChatShellEventsRequest(
      new Request("http://localhost/api/demos/streaming-chat-shell/events", {
        body: JSON.stringify({
          audience: "support",
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "Help me diagnose a timeout." }],
            },
          ],
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamStreamingChatShellEvents: async function* (_messages, _env, options) {
          yield { type: "start", audience: options.audience } as const;
          yield { type: "text", text: "Check the upstream dependency first." } as const;
          yield { type: "finish", finishReason: "stop" } as const;
        },
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "text/event-stream"
    );
    await expect(response.text()).resolves.toContain(
      '"audience":"support"'
    );
  });
});
