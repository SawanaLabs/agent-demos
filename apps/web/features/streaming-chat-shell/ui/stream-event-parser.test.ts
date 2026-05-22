import { describe, expect, it } from "vitest";

import { createStreamingChatShellEventParser } from "./stream-event-parser";

describe("streaming chat shell event parser", () => {
  it("reassembles split SSE chunks into typed events", () => {
    const parser = createStreamingChatShellEventParser();

    const firstEvents = parser.push(
      'data: {"type":"start","audience":"engineers"}\n\ndata: {"type":"text","text":"Hel'
    );
    const secondEvents = parser.push(
      'lo"}\n\ndata: {"type":"finish","finishReason":"stop"}\n\n'
    );

    expect(firstEvents).toEqual([{ type: "start", audience: "engineers" }]);
    expect(secondEvents).toEqual([
      { type: "text", text: "Hello" },
      { type: "finish", finishReason: "stop" },
    ]);
  });
});
