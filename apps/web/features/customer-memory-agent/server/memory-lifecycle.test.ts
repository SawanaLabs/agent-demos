import { describe, expect, it, vi } from "vitest";

import {
  type CustomerMemoryLifecycleOperation,
  createCustomerMemoryLifecycle,
} from "./memory-lifecycle";
import type { CustomerMemoryRecord } from "./memory-store";

function createMemoryRecord(
  overrides: Partial<CustomerMemoryRecord> = {}
): CustomerMemoryRecord {
  return {
    accessCount: 0,
    category: "constraint",
    content: "Acme cannot send HTML email.",
    createdAt: "2026-05-23T01:00:01.000Z",
    customerId: "acme-co",
    id: "memory-1",
    lastAccessedAt: null,
    metadata: null,
    sourceMessageId: "user-1",
    status: "active",
    threadId: "thread-1",
    title: "Email restriction",
    updatedAt: "2026-05-23T01:00:01.000Z",
    visitorId: "demo-shared",
    ...overrides,
  };
}

describe("customer memory lifecycle", () => {
  it("indexes saved memories after applying add and update operations", async () => {
    const created = createMemoryRecord();
    const updated = createMemoryRecord({
      content: "Acme only allows plain-text email.",
      id: "memory-2",
      status: "updated",
      title: "Plain-text only",
    });
    const addMemory = vi.fn().mockResolvedValue(created);
    const updateMemory = vi.fn().mockResolvedValue(updated);
    const deleteMemory = vi.fn().mockResolvedValue(undefined);
    const recordEvent = vi.fn().mockResolvedValue(undefined);
    const replaceEmbeddings = vi.fn().mockResolvedValue(undefined);
    const createEmbeddingPersistence = vi.fn(() => ({
      findMatches: vi.fn(),
      replaceEmbeddings,
    }));
    const indexMemories = vi.fn().mockResolvedValue(undefined);
    const lifecycle = createCustomerMemoryLifecycle({
      createEmbeddingPersistence,
      indexMemories,
      store: {
        addMemory,
        deleteMemory,
        recordEvent,
        updateMemory,
      },
    });

    const operations: CustomerMemoryLifecycleOperation[] = [
      {
        category: "constraint",
        content: "Acme only allows plain-text email.",
        memoryId: "memory-2",
        operation: "update",
        reason: "Constraint was clarified.",
        sourceMessageId: "user-2",
        title: "Plain-text only",
      },
      {
        category: "promise",
        content: "Weekly updates go out every Friday.",
        memoryId: null,
        operation: "add",
        reason: "Durable customer cadence.",
        sourceMessageId: "user-3",
        title: "Weekly cadence",
      },
      {
        category: "promise",
        content: "Weekly updates go out every Friday.",
        memoryId: null,
        operation: "add",
        reason: "Durable customer cadence.",
        sourceMessageId: "user-3",
        title: "Weekly cadence",
      },
    ];

    await expect(
      lifecycle.applyOperations(operations, {
        customerId: "acme-co",
        threadId: "thread-1",
        visitorId: "demo-shared",
      })
    ).resolves.toEqual([updated, created]);

    expect(updateMemory).toHaveBeenCalledTimes(1);
    expect(addMemory).toHaveBeenCalledTimes(1);
    expect(deleteMemory).not.toHaveBeenCalled();
    expect(recordEvent).not.toHaveBeenCalled();
    expect(createEmbeddingPersistence).toHaveBeenCalledTimes(1);
    expect(indexMemories).toHaveBeenCalledWith(
      [updated, created],
      expect.objectContaining({
        replaceEmbeddings,
      })
    );
  });

  it("indexes seeded shared demo memories through the same lifecycle", async () => {
    const first = createMemoryRecord();
    const second = createMemoryRecord({
      content: "Executive updates should stay forwardable.",
      id: "memory-2",
      title: "Forwardable updates",
    });
    const addMemory = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    const replaceEmbeddings = vi.fn().mockResolvedValue(undefined);
    const createEmbeddingPersistence = vi.fn(() => ({
      findMatches: vi.fn(),
      replaceEmbeddings,
    }));
    const indexMemories = vi.fn().mockResolvedValue(undefined);
    const lifecycle = createCustomerMemoryLifecycle({
      createEmbeddingPersistence,
      indexMemories,
      store: {
        addMemory,
        deleteMemory: vi.fn(),
        recordEvent: vi.fn(),
        updateMemory: vi.fn(),
      },
    });

    await expect(
      lifecycle.seedMemories(
        [
          {
            category: "constraint",
            content: "Claims need legal review before launch.",
            sourceMessageId: "seed-1",
            title: "Legal review",
          },
          {
            category: "preference",
            content: "Executive updates should stay forwardable.",
            sourceMessageId: "seed-2",
            title: "Forwardable updates",
          },
        ],
        {
          customerId: "acme-co",
          threadId: "thread-1",
          visitorId: "demo-shared",
        }
      )
    ).resolves.toEqual([first, second]);

    expect(addMemory).toHaveBeenCalledTimes(2);
    expect(createEmbeddingPersistence).toHaveBeenCalledTimes(1);
    expect(indexMemories).toHaveBeenCalledWith(
      [first, second],
      expect.objectContaining({
        replaceEmbeddings,
      })
    );
  });
});
