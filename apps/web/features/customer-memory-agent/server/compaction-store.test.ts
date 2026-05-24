import { describe, expect, it } from "vitest";

import {
  type CustomerMemoryCompactionPersistence,
  type CustomerMemoryCompactionRecord,
  createCustomerMemoryCompactionStore,
  shouldCompactCustomerMemoryThread,
} from "./compaction-store";

function createInMemoryPersistence(): CustomerMemoryCompactionPersistence {
  const compactions = new Map<string, CustomerMemoryCompactionRecord[]>();
  let compactionCounter = 0;

  return {
    createCompaction(input) {
      compactionCounter += 1;
      const record = {
        createdAt: new Date(
          `2026-05-23T02:00:${String(compactionCounter).padStart(2, "0")}Z`
        ).toISOString(),
        id: `compaction-${compactionCounter}`,
        messageCount: input.messageCount,
        summary: input.summary,
        threadId: input.threadId,
      };

      const existingRecords = compactions.get(input.threadId) ?? [];
      compactions.set(input.threadId, [record, ...existingRecords]);
      return Promise.resolve(record);
    },
    getLatestCompaction(threadId) {
      return Promise.resolve((compactions.get(threadId) ?? [])[0] ?? null);
    },
  };
}

describe("customer memory compaction store", () => {
  it("records the latest handoff compaction for a thread", async () => {
    const store = createCustomerMemoryCompactionStore({
      persistence: createInMemoryPersistence(),
    });

    await store.saveCompaction({
      messageCount: 12,
      summary: "Acme prefers weekly status updates and plain-text email only.",
      threadId: "thread-1",
    });

    await store.saveCompaction({
      messageCount: 16,
      summary:
        "Acme still requires plain-text email and now needs Friday updates for all incidents.",
      threadId: "thread-1",
    });

    await expect(store.getLatestCompaction("thread-1")).resolves.toEqual({
      createdAt: "2026-05-23T02:00:02.000Z",
      id: "compaction-2",
      messageCount: 16,
      summary:
        "Acme still requires plain-text email and now needs Friday updates for all incidents.",
      threadId: "thread-1",
    });
  });

  it("triggers handoff compaction when the message threshold is reached", () => {
    expect(
      shouldCompactCustomerMemoryThread({
        messageCount: 2,
        threshold: 3,
      })
    ).toBe(false);
    expect(
      shouldCompactCustomerMemoryThread({
        messageCount: 3,
        threshold: 3,
      })
    ).toBe(true);
  });
});
