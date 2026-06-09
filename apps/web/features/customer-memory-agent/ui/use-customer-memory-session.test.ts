import type { UIMessage } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { customerMemoryProfiles } from "../customer-profiles";
import {
  compactCustomerMemoryThread,
  resolveCustomerMemorySessionMessages,
  shouldApplyCustomerMemorySessionRefresh,
} from "./use-customer-memory-session-runtime";

afterEach(() => {
  vi.unstubAllGlobals();
});

function getTestCustomerMemoryProfile() {
  const profile = customerMemoryProfiles[0];

  if (!profile) {
    throw new Error("Expected at least one customer-memory profile.");
  }

  return profile;
}

describe("customer-memory session sync", () => {
  it("ignores stale refresh responses when a newer refresh has already started", () => {
    expect(
      shouldApplyCustomerMemorySessionRefresh({
        latestRequestId: 2,
        requestId: 1,
      })
    ).toBe(false);

    expect(
      shouldApplyCustomerMemorySessionRefresh({
        latestRequestId: 2,
        requestId: 2,
      })
    ).toBe(true);
  });

  it("keeps the local streamed thread when the refreshed session is shorter", () => {
    const localMessages: UIMessage[] = [
      {
        id: "user-1",
        parts: [{ text: "Remember the rollout constraint.", type: "text" }],
        role: "user",
      },
      {
        id: "assistant-1",
        parts: [{ text: "Saved.", type: "text" }],
        role: "assistant",
      },
      {
        id: "user-2",
        parts: [{ text: "Draft the reply.", type: "text" }],
        role: "user",
      },
      {
        id: "assistant-2",
        parts: [{ text: "Here is the reply.", type: "text" }],
        role: "assistant",
      },
    ];

    const profile = getTestCustomerMemoryProfile();

    expect(
      resolveCustomerMemorySessionMessages({
        fallbackMessages: localMessages,
        nextSession: {
          customer: profile,
          latestCompaction: null,
          memoryEvents: [],
          memories: [],
          messages: localMessages.slice(0, 2),
          relevantMemories: [],
          thread: {
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: profile.id,
            id: "thread-1",
            title: "Brightfield Health memory thread",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "visitor-1",
          },
          threads: [
            {
              createdAt: "2026-05-23T00:00:00.000Z",
              customerId: profile.id,
              id: "thread-1",
              messageCount: 2,
              title: "Brightfield Health memory thread",
              updatedAt: "2026-05-23T00:00:00.000Z",
              visitorId: "visitor-1",
            },
          ],
        },
      })
    ).toEqual(localMessages);
  });

  it("drops stale empty assistant turns before comparing local fallback with the refreshed session", () => {
    const profile = getTestCustomerMemoryProfile();
    const persistedUserMessage: UIMessage = {
      id: "user-1",
      parts: [{ text: "Remember the rollout constraint.", type: "text" }],
      role: "user",
    };
    const persistedAssistantMessage: UIMessage = {
      id: "assistant-2",
      parts: [{ text: "Saved.", type: "text" }],
      role: "assistant",
    };
    const persistedMessages: UIMessage[] = [
      persistedUserMessage,
      persistedAssistantMessage,
    ];
    const localMessages: UIMessage[] = [
      persistedUserMessage,
      {
        id: "assistant-failed",
        parts: [],
        role: "assistant",
      },
      persistedAssistantMessage,
    ];

    expect(
      resolveCustomerMemorySessionMessages({
        fallbackMessages: localMessages,
        nextSession: {
          customer: profile,
          latestCompaction: null,
          memoryEvents: [],
          memories: [],
          messages: persistedMessages,
          relevantMemories: [],
          thread: {
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: profile.id,
            id: "thread-1",
            title: "Brightfield Health memory thread",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "visitor-1",
          },
          threads: [
            {
              createdAt: "2026-05-23T00:00:00.000Z",
              customerId: profile.id,
              id: "thread-1",
              messageCount: 2,
              title: "Brightfield Health memory thread",
              updatedAt: "2026-05-23T00:00:00.000Z",
              visitorId: "visitor-1",
            },
          ],
        },
      })
    ).toEqual(persistedMessages);
  });
});

describe("customer-memory manual compaction transport", () => {
  it("uses usage-gate message payloads for compact errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ message: "Daily demo usage limit reached." }),
          {
            headers: { "Content-Type": "application/json" },
            status: 429,
          }
        )
      )
    );

    await expect(
      compactCustomerMemoryThread({
        customerId: "demo-sandbox",
        threadId: "thread-1",
      })
    ).rejects.toThrow("Daily demo usage limit reached.");
  });
});
