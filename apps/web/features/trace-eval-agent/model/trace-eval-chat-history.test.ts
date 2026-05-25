import { describe, expect, it } from "vitest";

import { projectTraceEvalHistoryForModel } from "./trace-eval-chat-history";

describe("projectTraceEvalHistoryForModel", () => {
  it("drops tool, source, and reasoning parts from assistant history", () => {
    const projected = projectTraceEvalHistoryForModel([
      {
        id: "u1",
        parts: [{ text: "Research Tesla", type: "text" as const }],
        role: "user" as const,
      },
      {
        id: "a1",
        parts: [
          { text: "Thinking", type: "reasoning" as const },
          {
            input: { query: "Tesla latest" },
            output: { results: [{ title: "one", snippet: undefined }] },
            state: "output-available" as const,
            toolCallId: "call_1",
            type: "tool-web_search" as const,
          },
          {
            providerMetadata: undefined,
            sourceId: "src_1",
            title: "Example",
            type: "source-url" as const,
            url: "https://example.com",
          },
          {
            text: "Tesla is a public company focused on EVs and energy.",
            type: "text" as const,
          },
        ],
        role: "assistant" as const,
      },
    ]);

    expect(projected).toEqual([
      {
        id: "u1",
        parts: [{ text: "Research Tesla", type: "text" }],
        role: "user",
      },
      {
        id: "a1",
        parts: [
          {
            text: "Tesla is a public company focused on EVs and energy.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ]);
  });

  it("drops refusal assistant turns from replay history", () => {
    const projected = projectTraceEvalHistoryForModel([
      {
        id: "u1",
        parts: [{ text: "hello", type: "text" as const }],
        role: "user" as const,
      },
      {
        id: "a1",
        parts: [
          {
            text: "I'm sorry, but I cannot assist with that request.",
            type: "text" as const,
          },
        ],
        role: "assistant" as const,
      },
      {
        id: "u2",
        parts: [{ text: "Research Tesla", type: "text" as const }],
        role: "user" as const,
      },
    ]);

    expect(projected).toEqual([
      {
        id: "u1",
        parts: [{ text: "hello", type: "text" }],
        role: "user",
      },
      {
        id: "u2",
        parts: [{ text: "Research Tesla", type: "text" }],
        role: "user",
      },
    ]);
  });
});
