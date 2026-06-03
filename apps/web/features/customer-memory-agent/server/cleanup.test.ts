import { describe, expect, it, vi } from "vitest";

import {
  type CustomerMemoryCleanupPersistence,
  cleanupExpiredCustomerMemoryThreads,
  customerMemoryCleanupRetentionDays,
} from "./cleanup";

function createPersistence(
  overrides: Partial<CustomerMemoryCleanupPersistence> = {}
): CustomerMemoryCleanupPersistence {
  return {
    countCompactionsForThreads: vi.fn().mockResolvedValue(1),
    countMemoriesForThreads: vi.fn().mockResolvedValue(2),
    countMessagesForThreads: vi.fn().mockResolvedValue(4),
    deleteEventsOlderThan: vi.fn().mockResolvedValue(3),
    deleteMemoriesForThreads: vi.fn().mockResolvedValue(2),
    deleteThreadsByIds: vi.fn().mockResolvedValue(1),
    findExpiredThreads: vi.fn().mockResolvedValue([
      {
        customerId: "demo-sandbox",
        id: "thread-1",
        updatedAt: "2026-05-19T20:00:00.000Z",
        visitorId: "visitor-123",
      },
    ]),
    ...overrides,
  };
}

describe("customer memory cleanup", () => {
  it("deletes expired visitor-private thread data and reports deleted counts", async () => {
    const persistence = createPersistence();

    const result = await cleanupExpiredCustomerMemoryThreads(
      {
        now: new Date("2026-05-23T20:00:00.000Z"),
        retentionDays: customerMemoryCleanupRetentionDays,
        visitorPrivateCustomerIds: ["demo-sandbox"],
      },
      { persistence }
    );

    expect(persistence.findExpiredThreads).toHaveBeenCalledWith({
      customerIds: ["demo-sandbox"],
      olderThan: "2026-05-16T20:00:00.000Z",
    });
    expect(persistence.deleteEventsOlderThan).toHaveBeenCalledWith({
      customerIds: ["demo-sandbox"],
      olderThan: "2026-05-16T20:00:00.000Z",
    });
    expect(persistence.deleteMemoriesForThreads).toHaveBeenCalledWith([
      "thread-1",
    ]);
    expect(persistence.deleteThreadsByIds).toHaveBeenCalledWith(["thread-1"]);
    expect(result).toEqual({
      compactionsDeleted: 1,
      cutoff: "2026-05-16T20:00:00.000Z",
      eventsDeleted: 3,
      memoriesDeleted: 2,
      messagesDeleted: 4,
      retentionDays: customerMemoryCleanupRetentionDays,
      threadsDeleted: 1,
      threadIds: ["thread-1"],
    });
  });

  it("skips deletion when no visitor-private thread has expired", async () => {
    const persistence = createPersistence({
      deleteEventsOlderThan: vi.fn().mockResolvedValue(2),
      findExpiredThreads: vi.fn().mockResolvedValue([]),
    });

    const result = await cleanupExpiredCustomerMemoryThreads(
      {
        now: new Date("2026-05-23T20:00:00.000Z"),
        visitorPrivateCustomerIds: ["demo-sandbox"],
      },
      { persistence }
    );

    expect(persistence.deleteEventsOlderThan).toHaveBeenCalledWith({
      customerIds: ["demo-sandbox"],
      olderThan: "2026-05-16T20:00:00.000Z",
    });
    expect(persistence.deleteMemoriesForThreads).not.toHaveBeenCalled();
    expect(persistence.deleteThreadsByIds).not.toHaveBeenCalled();
    expect(result).toEqual({
      compactionsDeleted: 0,
      cutoff: "2026-05-16T20:00:00.000Z",
      eventsDeleted: 2,
      memoriesDeleted: 0,
      messagesDeleted: 0,
      retentionDays: customerMemoryCleanupRetentionDays,
      threadsDeleted: 0,
      threadIds: [],
    });
  });

  it("fails early when no visitor-private customer ids are configured", async () => {
    await expect(
      cleanupExpiredCustomerMemoryThreads({
        now: new Date("2026-05-23T20:00:00.000Z"),
        visitorPrivateCustomerIds: [],
      })
    ).rejects.toThrow(
      "Customer-memory cleanup requires at least one visitor-private customer id."
    );
  });
});
