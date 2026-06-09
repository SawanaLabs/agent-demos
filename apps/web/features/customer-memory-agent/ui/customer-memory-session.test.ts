import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import { customerMemoryProfiles } from "../customer-profiles";
import {
  buildCustomerMemorySessionViewState,
  getCustomerMemoryCompactionControlState,
  getCustomerMemoryPendingCompaction,
  getLatestCustomerMemoryPrompt,
  removeEmptyCustomerMemoryAssistantMessages,
} from "./customer-memory-session";

describe("customer-memory session view state", () => {
  it("reads the latest non-empty user prompt from a thread", () => {
    expect(
      getLatestCustomerMemoryPrompt([
        {
          id: "assistant-1",
          parts: [{ text: "hello", type: "text" }],
          role: "assistant",
        },
        {
          id: "user-1",
          parts: [{ text: "remember the legal review policy", type: "text" }],
          role: "user",
        },
        {
          id: "assistant-2",
          parts: [{ text: "saved", type: "text" }],
          role: "assistant",
        },
      ])
    ).toBe("remember the legal review policy");
  });

  it("summarizes the current session surface for the workspace", () => {
    const profile = customerMemoryProfiles[0];

    if (!profile) {
      throw new Error("Expected at least one customer-memory profile.");
    }

    expect(
      buildCustomerMemorySessionViewState({
        customer: profile,
        latestCompaction: {
          createdAt: "2026-05-23T00:00:00.000Z",
          id: "compact-1",
          messageCount: 12,
          summary: "Older contract discussion summary.",
          threadId: "thread-1",
        },
        memoryEvents: [],
        memories: [
          {
            accessCount: 0,
            category: "promise",
            content: "Provide legal-safe launch copy on Monday.",
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: profile.id,
            id: "memory-1",
            lastAccessedAt: null,
            metadata: null,
            sourceMessageId: "user-1",
            status: "active",
            threadId: "thread-1",
            title: "Launch copy promise",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "demo-shared",
          },
        ],
        messages: [
          {
            id: "user-1",
            parts: [{ text: "Need an exec-safe status update", type: "text" }],
            role: "user",
          },
        ],
        relevantMemories: [
          {
            accessCount: 0,
            category: "promise",
            content: "Provide legal-safe launch copy on Monday.",
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: profile.id,
            id: "memory-1",
            lastAccessedAt: null,
            metadata: null,
            similarity: 0.91,
            sourceMessageId: "user-1",
            status: "active",
            threadId: "thread-1",
            title: "Launch copy promise",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "demo-shared",
          },
        ],
        thread: {
          createdAt: "2026-05-23T00:00:00.000Z",
          customerId: profile.id,
          id: "thread-1",
          title: "Acme memory thread",
          updatedAt: "2026-05-23T00:00:00.000Z",
          visitorId: "demo-shared",
        },
        threads: [
          {
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: profile.id,
            id: "thread-1",
            messageCount: 1,
            title: "Acme memory thread",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "demo-shared",
          },
        ],
      })
    ).toEqual({
      activeThreadId: "thread-1",
      customer: profile,
      hasMessages: true,
      latestPrompt: "Need an exec-safe status update",
      latestSummary: "Older contract discussion summary.",
      memoryEventCount: 0,
      memoryCount: 1,
      messageCount: 1,
      relevantMemoryCount: 1,
      threadCount: 1,
    });
  });
});

describe("customer-memory session compaction state", () => {
  it("reports pending compaction only when a loading thread crosses a new compaction target", () => {
    expect(
      getCustomerMemoryPendingCompaction({
        compactionThreshold: 20,
        isSessionLoading: true,
        latestCompactionMessageCount: null,
        messageCount: 20,
      })
    ).toEqual({ messageCount: 18 });

    expect(
      getCustomerMemoryPendingCompaction({
        compactionThreshold: 20,
        isSessionLoading: true,
        latestCompactionMessageCount: 18,
        messageCount: 37,
      })
    ).toBeNull();

    expect(
      getCustomerMemoryPendingCompaction({
        compactionThreshold: 20,
        isSessionLoading: false,
        latestCompactionMessageCount: null,
        messageCount: 20,
      })
    ).toBeNull();
  });

  it("builds manual compaction control state from uncompacted message count", () => {
    expect(
      getCustomerMemoryCompactionControlState({
        compactionThreshold: 20,
        latestCompactionMessageCount: null,
        messageCount: 2,
      })
    ).toMatchObject({
      canCompactManually: false,
      compactableMessageCount: 0,
      progressRatio: 0.1,
      remainingUntilAutomaticCompact: 18,
      uncompactedMessageCount: 2,
    });

    expect(
      getCustomerMemoryCompactionControlState({
        compactionThreshold: 20,
        latestCompactionMessageCount: 18,
        messageCount: 21,
      })
    ).toMatchObject({
      canCompactManually: true,
      compactableMessageCount: 1,
      progressRatio: 0.15,
      remainingUntilAutomaticCompact: 17,
      targetMessageCount: 19,
      uncompactedMessageCount: 3,
    });
  });
});

describe("customer-memory session message cleanup", () => {
  it("removes empty assistant messages from retry cleanup without touching tool-only turns", () => {
    const messages: UIMessage[] = [
      {
        id: "user-1",
        parts: [{ text: "Remember the preference.", type: "text" }],
        role: "user" as const,
      },
      {
        id: "assistant-empty",
        parts: [],
        role: "assistant" as const,
      },
      {
        id: "assistant-tool",
        parts: [
          {
            input: { operation: "noop", reason: "No durable fact." },
            output: { accepted: true },
            state: "output-available",
            toolCallId: "tool-1",
            type: "tool-manageCustomerMemory",
          },
        ],
        role: "assistant" as const,
      },
    ];

    expect(removeEmptyCustomerMemoryAssistantMessages(messages)).toEqual([
      messages[0],
      messages[2],
    ]);
  });
});
