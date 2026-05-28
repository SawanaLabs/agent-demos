import { describe, expect, it } from "vitest";

import { parseLangGraphSseStream } from "./sse-parser";
import type { LangGraphStreamEvent } from "./stream-normalizer";

describe("LangGraph SSE parser", () => {
  it("parses official event/data frames from a chunked stream", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode('event: updates\ndata: {"plan":{"next":"check"}}\n\n')
        );
        controller.enqueue(
          encoder.encode(
            'event: messages-tuple\ndata: [{"content":"hi"},{"langgraph_node":"answer"}]\n\n'
          )
        );
        controller.close();
      },
    });

    const events: LangGraphStreamEvent[] = [];

    for await (const event of parseLangGraphSseStream(stream)) {
      events.push(event);
    }

    expect(events).toEqual([
      {
        data: {
          plan: {
            next: "check",
          },
        },
        event: "updates",
      },
      {
        data: [
          {
            content: "hi",
          },
          {
            langgraph_node: "answer",
          },
        ],
        event: "messages-tuple",
      },
    ]);
  });
});
