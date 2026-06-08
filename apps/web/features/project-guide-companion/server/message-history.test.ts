import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  prepareProjectGuideCompanionContextMessages,
  projectGuideCompanionContextWindowMs,
} from "../message-history";

function createMessage(input: {
  createdAt: string;
  id: string;
  role: "assistant" | "user";
  text: string;
}): UIMessage {
  return {
    id: input.id,
    metadata: {
      createdAt: input.createdAt,
    },
    parts: [{ text: input.text, type: "text" }],
    role: input.role,
  };
}

describe("prepareProjectGuideCompanionContextMessages", () => {
  it("keeps only recent visible text and source summaries for model context", () => {
    const now = new Date("2026-06-08T12:00:00.000Z");
    const oldMessage = createMessage({
      createdAt: new Date(
        now.getTime() - projectGuideCompanionContextWindowMs - 1000
      ).toISOString(),
      id: "old-user",
      role: "user",
      text: "Tell me about an old decision.",
    });
    const recentAssistant = {
      id: "assistant-1",
      metadata: {
        createdAt: "2026-06-08T11:59:00.000Z",
        sources: [{ label: "docs/frontend/project-guide-companion.md" }],
      },
      parts: [
        {
          input: {},
          output: {
            content: [
              {
                text: '{"matches":[{"path":"docs/frontend/project-guide-companion.md"}]}',
                type: "text",
              },
            ],
          },
          state: "output-available",
          toolCallId: "tool-1",
          toolName: "searchProjectDocs",
          type: "dynamic-tool",
        },
        {
          text: "The companion uses sessionStorage for its MVP history.",
          type: "text",
        },
      ],
      role: "assistant",
    } satisfies UIMessage;

    const projected = prepareProjectGuideCompanionContextMessages({
      messages: [
        oldMessage,
        createMessage({
          createdAt: "2026-06-08T11:58:00.000Z",
          id: "user-1",
          role: "user",
          text: "Where does companion history live?",
        }),
        recentAssistant,
      ],
      now,
    });

    expect(projected).toEqual([
      {
        id: "user-1",
        metadata: {
          createdAt: "2026-06-08T11:58:00.000Z",
        },
        parts: [
          {
            text: "Where does companion history live?",
            type: "text",
          },
        ],
        role: "user",
      },
      {
        id: "assistant-1",
        metadata: {
          createdAt: "2026-06-08T11:59:00.000Z",
          sources: [{ label: "docs/frontend/project-guide-companion.md" }],
        },
        parts: [
          {
            text: [
              "The companion uses sessionStorage for its MVP history.",
              "Sources: docs/frontend/project-guide-companion.md",
            ].join("\n"),
            type: "text",
          },
        ],
        role: "assistant",
      },
    ]);
    expect(JSON.stringify(projected)).not.toContain("matches");
  });
});
