import { describe, expect, it, vi } from "vitest";

import { createRemoteLangGraphClient } from "./remote-langgraph-client";

describe("Remote LangGraph client", () => {
  it("starts an official thread-scoped streaming run", async () => {
    const threadResponse = Response.json(
      {
        thread_id: "8992600f-cd01-43a5-9463-a960efdd509f",
      },
      { status: 200 }
    );
    const streamResponse = new Response("event: updates\ndata: {}\n\n", {
      headers: {
        "content-type": "text/event-stream",
      },
      status: 200,
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(threadResponse)
      .mockResolvedValueOnce(streamResponse);
    const client = createRemoteLangGraphClient({
      apiKey: "langsmith-test-key",
      baseUrl: "http://localhost:2024/",
      fetch: fetchMock,
    });

    await expect(
      client.streamThreadRun({
        assistantId: "agent",
        messages: [
          {
            id: "m1",
            parts: [{ text: "Validate the official path", type: "text" }],
            role: "user",
          },
        ],
        threadId: "8992600f-cd01-43a5-9463-a960efdd509f",
      })
    ).resolves.toBe(streamResponse);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:2024/threads",
      {
        body: JSON.stringify({
          if_exists: "do_nothing",
          thread_id: "8992600f-cd01-43a5-9463-a960efdd509f",
        }),
        headers: {
          "content-type": "application/json",
          "x-api-key": "langsmith-test-key",
        },
        method: "POST",
      }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:2024/threads/8992600f-cd01-43a5-9463-a960efdd509f/runs/stream",
      {
        body: JSON.stringify({
          assistant_id: "agent",
          input: {
            messages: [
              {
                content: "Validate the official path",
                role: "human",
              },
            ],
          },
          stream_mode: ["updates", "messages-tuple"],
        }),
        headers: {
          "content-type": "application/json",
          "x-api-key": "langsmith-test-key",
        },
        method: "POST",
      }
    );
  });
});
