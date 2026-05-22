import { describe, expect, it } from "vitest";

import { getReplayPromptEntries } from "./replay-prompts";

describe("getReplayPromptEntries", () => {
  it("builds replay entries from user prompts and slices the thread prefix", () => {
    const entries = getReplayPromptEntries([
      {
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "first question" }],
      },
      {
        id: "a1",
        role: "assistant",
        parts: [{ type: "text", text: "first answer" }],
      },
      {
        id: "u2",
        role: "user",
        parts: [{ type: "text", text: "second question" }],
      },
      {
        id: "a2",
        role: "assistant",
        parts: [{ type: "text", text: "second answer" }],
      },
      {
        id: "u3",
        role: "user",
        parts: [{ type: "text", text: "third question" }],
      },
      {
        id: "a3",
        role: "assistant",
        parts: [{ type: "text", text: "third answer" }],
      },
    ]);

    expect(entries.map((entry) => entry.id)).toEqual(["u3", "u2", "u1"]);
    expect(entries.map((entry) => entry.promptText)).toEqual([
      "third question",
      "second question",
      "first question",
    ]);
    expect(entries[0]?.replayMessages.map((message) => message.id)).toEqual([
      "u1",
      "a1",
      "u2",
      "a2",
      "u3",
    ]);
    expect(entries[1]?.replayMessages.map((message) => message.id)).toEqual([
      "u1",
      "a1",
      "u2",
    ]);
    expect(entries[2]?.replayMessages.map((message) => message.id)).toEqual([
      "u1",
    ]);
  });

  it("skips empty user prompts", () => {
    const entries = getReplayPromptEntries([
      {
        id: "u1",
        role: "user",
        parts: [{ type: "text", text: "   " }],
      },
      {
        id: "u2",
        role: "user",
        parts: [{ type: "text", text: "kept" }],
      },
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe("u2");
  });
});
