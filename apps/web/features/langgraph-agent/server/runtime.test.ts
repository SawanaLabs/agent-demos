import type { UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";

import {
  getLangGraphAgentRuntimeState,
  handleLangGraphAgentRequest,
  streamLangGraphAgent,
} from "./runtime";

function createUserMessage(): UIMessage {
  return {
    id: "user-1",
    parts: [
      {
        text: "Validate the official LangGraph path.",
        type: "text",
      },
    ],
    role: "user",
  };
}

describe("langgraph agent runtime", () => {
  it("reports setup requirements when remote LangGraph config is missing", () => {
    expect(getLangGraphAgentRuntimeState({})).toMatchObject({
      isChatAvailable: false,
      setupMessage: expect.stringContaining("LANGGRAPH_AGENT_API_URL"),
      statusLabel: "Setup required",
    });
  });

  it("streams official LangGraph SSE frames as AI SDK UI message chunks", async () => {
    const response = new Response(
      [
        'event: updates\ndata: {"plan":{"next":"check docs"}}\n\n',
        'event: messages-tuple\ndata: [{"content":"Validated."},{"langgraph_node":"answer","run_id":"run-1"}]\n\n',
      ].join(""),
      {
        headers: {
          "content-type": "text/event-stream",
        },
      }
    );
    const client = {
      streamThreadRun: vi.fn(async () => response),
    };

    const uiResponse = await streamLangGraphAgent(
      {
        messages: [createUserMessage()],
        threadId: "thread-1",
      },
      {
        LANGGRAPH_AGENT_API_URL: "http://localhost:2024",
        LANGGRAPH_AGENT_ASSISTANT_ID: "agent",
      },
      {
        client,
      }
    );

    await expect(uiResponse.text()).resolves.toContain("Validated.");
    expect(client.streamThreadRun).toHaveBeenCalledWith({
      assistantId: "agent",
      messages: [createUserMessage()],
      threadId: "thread-1",
    });
  });

  it("rejects request bodies without a thread id", async () => {
    const response = await handleLangGraphAgentRequest(
      new Request("http://localhost/api/demos/langgraph-agent", {
        body: JSON.stringify({
          messages: [createUserMessage()],
        }),
        method: "POST",
      }),
      {
        LANGGRAPH_AGENT_API_URL: "http://localhost:2024",
        LANGGRAPH_AGENT_ASSISTANT_ID: "agent",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        'Expected a JSON body with "messages" array and "threadId" string.',
    });
  });
});
