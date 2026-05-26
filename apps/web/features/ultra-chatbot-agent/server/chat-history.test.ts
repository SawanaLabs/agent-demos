import { describe, expect, it } from "vitest";

import { projectUltraChatbotAgentHistoryForModel } from "./chat-history";

describe("projectUltraChatbotAgentHistoryForModel", () => {
  it("drops assistant tool, source, and reasoning parts before replay", () => {
    const projected = projectUltraChatbotAgentHistoryForModel([
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
            output: { results: [{ title: "Tesla", url: "https://tesla.com" }] },
            state: "output-available" as const,
            toolCallId: "call_1",
            type: "tool-web_search" as const,
          },
          {
            providerMetadata: undefined,
            sourceId: "src_1",
            title: "Tesla",
            type: "source-url" as const,
            url: "https://tesla.com",
          },
          {
            text: "Tesla is an EV and energy company.",
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
            text: "Tesla is an EV and energy company.",
            type: "text",
          },
        ],
        role: "assistant",
      },
    ]);
  });

  it("drops assistant turns that only contain tools", () => {
    const projected = projectUltraChatbotAgentHistoryForModel([
      {
        id: "u1",
        parts: [{ text: "Find sources", type: "text" as const }],
        role: "user" as const,
      },
      {
        id: "a1",
        parts: [
          {
            input: { query: "Find sources" },
            output: { results: [] },
            state: "output-available" as const,
            toolCallId: "call_1",
            type: "tool-web_search" as const,
          },
        ],
        role: "assistant" as const,
      },
      {
        id: "u2",
        parts: [{ text: "Continue", type: "text" as const }],
        role: "user" as const,
      },
    ]);

    expect(projected).toEqual([
      {
        id: "u1",
        parts: [{ text: "Find sources", type: "text" }],
        role: "user",
      },
      {
        id: "u2",
        parts: [{ text: "Continue", type: "text" }],
        role: "user",
      },
    ]);
  });
});
