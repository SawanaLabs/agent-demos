import { describe, expect, it, vi } from "vitest";

import { loadCustomerMemorySession } from "./session";

describe("customer memory session", () => {
  it("creates a fresh writable thread when the stored thread id is stale and no visible threads remain", async () => {
    const threadStore = {
      createThread: vi.fn().mockResolvedValue({
        createdAt: "2026-05-23T00:00:00.000Z",
        customerId: "demo-sandbox",
        id: "thread-new",
        title: "Brightfield memory thread",
        updatedAt: "2026-05-23T00:00:00.000Z",
        visitorId: "visitor-123",
      }),
      listThreads: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: "demo-sandbox",
            id: "thread-new",
            messageCount: 0,
            title: "Brightfield memory thread",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "visitor-123",
          },
        ]),
      loadThread: vi.fn(),
      loadThreadForViewer: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          messages: [],
          thread: {
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: "demo-sandbox",
            id: "thread-new",
            title: "Brightfield memory thread",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "visitor-123",
          },
        }),
      saveThreadMessages: vi.fn(),
    };

    const session = await loadCustomerMemorySession(
      {
        customerId: "demo-sandbox",
        query: "",
        threadId: "thread-stale",
        visitorId: "visitor-123",
      },
      {
        compactionStore: {
          getLatestCompaction: vi.fn().mockResolvedValue(null),
          saveCompaction: vi.fn(),
        },
        ensureSharedDemoSeed: vi.fn(),
        findRelevantCustomerMemory: vi.fn().mockResolvedValue([]),
        memoryStore: {
          listEvents: vi.fn().mockResolvedValue([]),
          listMemories: vi.fn().mockResolvedValue([]),
        },
        threadStore,
      }
    );

    expect(threadStore.createThread).toHaveBeenCalledWith({
      customerId: "demo-sandbox",
      title: "Brightfield Health memory thread",
      visitorId: "visitor-123",
    });
    expect(session.thread.id).toBe("thread-new");
    expect(session.messages).toEqual([]);
  });

  it("falls back to the customer's latest visible thread when the stored thread id is stale", async () => {
    const threadStore = {
      createThread: vi.fn(),
      listThreads: vi.fn().mockResolvedValue([
        {
          createdAt: "2026-05-23T00:00:00.000Z",
          customerId: "demo-sandbox",
          id: "thread-current",
          messageCount: 2,
          title: "Brightfield memory thread",
          updatedAt: "2026-05-23T00:00:00.000Z",
          visitorId: "visitor-123",
        },
      ]),
      loadThread: vi.fn(),
      loadThreadForViewer: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          messages: [
            {
              id: "assistant-1",
              parts: [{ text: "Recovered thread", type: "text" }],
              role: "assistant",
            },
          ],
          thread: {
            createdAt: "2026-05-23T00:00:00.000Z",
            customerId: "demo-sandbox",
            id: "thread-current",
            title: "Brightfield memory thread",
            updatedAt: "2026-05-23T00:00:00.000Z",
            visitorId: "visitor-123",
          },
        }),
      saveThreadMessages: vi.fn(),
    };

    const session = await loadCustomerMemorySession(
      {
        customerId: "demo-sandbox",
        query: "",
        threadId: "thread-stale",
        visitorId: "visitor-123",
      },
      {
        compactionStore: {
          getLatestCompaction: vi.fn().mockResolvedValue(null),
          saveCompaction: vi.fn(),
        },
        ensureSharedDemoSeed: vi.fn(),
        findRelevantCustomerMemory: vi.fn().mockResolvedValue([]),
        memoryStore: {
          listEvents: vi.fn().mockResolvedValue([]),
          listMemories: vi.fn().mockResolvedValue([]),
        },
        threadStore,
      }
    );

    expect(threadStore.loadThreadForViewer).toHaveBeenNthCalledWith(1, {
      customerId: "demo-sandbox",
      threadId: "thread-stale",
      visitorId: "visitor-123",
    });
    expect(threadStore.loadThreadForViewer).toHaveBeenNthCalledWith(2, {
      customerId: "demo-sandbox",
      threadId: "thread-current",
      visitorId: "visitor-123",
    });
    expect(session.thread.id).toBe("thread-current");
    expect(session.messages).toEqual([
      {
        id: "assistant-1",
        parts: [{ text: "Recovered thread", type: "text" }],
        role: "assistant",
      },
    ]);
  });
});
