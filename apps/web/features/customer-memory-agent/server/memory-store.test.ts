import { describe, expect, it } from "vitest";

import {
  type CustomerMemoryEventRecord,
  type CustomerMemoryMemoryPersistence,
  type CustomerMemoryRecord,
  createCustomerMemoryStore,
} from "./memory-store";

function createInMemoryPersistence(): CustomerMemoryMemoryPersistence {
  const memories = new Map<string, CustomerMemoryRecord>();
  const events: CustomerMemoryEventRecord[] = [];
  let memoryCounter = 0;
  let eventCounter = 0;

  function nextDate(offset: number) {
    return new Date(
      `2026-05-23T01:00:${String(offset).padStart(2, "0")}Z`
    ).toISOString();
  }

  function recordEvent(
    input: Omit<CustomerMemoryEventRecord, "createdAt" | "id">
  ) {
    eventCounter += 1;
    const event = {
      ...input,
      createdAt: nextDate(eventCounter),
      id: `event-${eventCounter}`,
    };
    events.push(event);
    return event;
  }

  return {
    createMemory(input) {
      memoryCounter += 1;
      const now = nextDate(memoryCounter);
      const memory = {
        accessCount: 0,
        category: input.category,
        content: input.content,
        createdAt: now,
        customerId: input.customerId,
        id: `memory-${memoryCounter}`,
        lastAccessedAt: null,
        metadata: input.metadata ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        status: "active" as const,
        threadId: input.threadId ?? null,
        title: input.title ?? null,
        updatedAt: now,
        visitorId: input.visitorId,
      };

      memories.set(memory.id, memory);
      recordEvent({
        afterContent: memory.content,
        beforeContent: null,
        customerId: memory.customerId,
        memoryId: memory.id,
        metadata: memory.metadata,
        operation: "add",
        reason: input.reason ?? null,
        sourceMessageId: memory.sourceMessageId,
        threadId: memory.threadId,
        visitorId: memory.visitorId,
      });

      return Promise.resolve(memory);
    },
    listEventsForCustomer(input) {
      return Promise.resolve(
        events
          .filter(
            (event) =>
              event.customerId === input.customerId &&
              event.visitorId === input.visitorId
          )
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      );
    },
    listVisibleMemoriesForCustomer(input) {
      return Promise.resolve(
        [...memories.values()]
          .filter(
            (memory) =>
              memory.customerId === input.customerId &&
              memory.visitorId === input.visitorId &&
              memory.status !== "deleted"
          )
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      );
    },
    async markMemoryAccessed(input) {
      for (const memoryId of input.memoryIds) {
        const memory = memories.get(memoryId);

        if (
          !memory ||
          memory.customerId !== input.customerId ||
          memory.visitorId !== input.visitorId
        ) {
          continue;
        }

        memories.set(memoryId, {
          ...memory,
          accessCount: memory.accessCount + 1,
          lastAccessedAt: "2026-05-23T02:00:00.000Z",
        });
      }

      return;
    },
    recordEvent(input) {
      return Promise.resolve(
        recordEvent({
          afterContent: input.afterContent ?? null,
          beforeContent: input.beforeContent ?? null,
          customerId: input.customerId,
          memoryId: input.memoryId ?? null,
          metadata: input.metadata ?? null,
          operation: input.operation,
          reason: input.reason ?? null,
          sourceMessageId: input.sourceMessageId ?? null,
          threadId: input.threadId ?? null,
          visitorId: input.visitorId,
        })
      );
    },
    async updateMemory(input) {
      const memory = memories.get(input.memoryId);

      if (
        !memory ||
        memory.customerId !== input.customerId ||
        memory.visitorId !== input.visitorId ||
        memory.status === "deleted"
      ) {
        throw new Error(
          `No active customer memory found for ${input.memoryId}.`
        );
      }

      const next = {
        ...memory,
        category: input.category ?? memory.category,
        content: input.content,
        metadata: input.metadata ?? memory.metadata,
        sourceMessageId: input.sourceMessageId ?? memory.sourceMessageId,
        status: "updated" as const,
        title: input.title ?? memory.title,
        updatedAt: "2026-05-23T01:00:30.000Z",
      };

      memories.set(memory.id, next);
      recordEvent({
        afterContent: next.content,
        beforeContent: memory.content,
        customerId: next.customerId,
        memoryId: next.id,
        metadata: next.metadata,
        operation: "update",
        reason: input.reason ?? null,
        sourceMessageId: next.sourceMessageId,
        threadId: next.threadId,
        visitorId: next.visitorId,
      });

      return next;
    },
    async deleteMemory(input) {
      const memory = memories.get(input.memoryId);

      if (
        !memory ||
        memory.customerId !== input.customerId ||
        memory.visitorId !== input.visitorId ||
        memory.status === "deleted"
      ) {
        throw new Error(
          `No active customer memory found for ${input.memoryId}.`
        );
      }

      const next = {
        ...memory,
        status: "deleted" as const,
        updatedAt: "2026-05-23T01:00:40.000Z",
      };

      memories.set(memory.id, next);
      recordEvent({
        afterContent: null,
        beforeContent: memory.content,
        customerId: next.customerId,
        memoryId: next.id,
        metadata: next.metadata,
        operation: "delete",
        reason: input.reason ?? null,
        sourceMessageId: input.sourceMessageId ?? next.sourceMessageId,
        threadId: next.threadId,
        visitorId: next.visitorId,
      });

      return;
    },
  };
}

describe("customer memory store", () => {
  it("manages visible memories through add, update, delete, and event history", async () => {
    const store = createCustomerMemoryStore({
      persistence: createInMemoryPersistence(),
    });

    const created = await store.addMemory({
      category: "constraint",
      content: "Acme cannot send HTML email.",
      customerId: "acme-co",
      reason: "User stated a durable account constraint.",
      sourceMessageId: "user-1",
      threadId: "thread-1",
      title: "Email restriction",
      visitorId: "demo-shared",
    });

    const updated = await store.updateMemory({
      content: "Acme can send plain-text email only.",
      customerId: "acme-co",
      memoryId: created.id,
      reason: "User clarified the allowed email format.",
      title: "Plain-text email restriction",
      visitorId: "demo-shared",
    });

    expect(updated.status).toBe("updated");
    await expect(
      store.listMemories({ customerId: "acme-co", visitorId: "demo-shared" })
    ).resolves.toEqual([
      expect.objectContaining({
        content: "Acme can send plain-text email only.",
        id: created.id,
        status: "updated",
        title: "Plain-text email restriction",
      }),
    ]);

    await store.deleteMemory({
      customerId: "acme-co",
      memoryId: created.id,
      reason: "The account restriction was removed.",
      visitorId: "demo-shared",
    });

    await expect(
      store.listMemories({ customerId: "acme-co", visitorId: "demo-shared" })
    ).resolves.toEqual([]);
    await expect(
      store.listEvents({ customerId: "acme-co", visitorId: "demo-shared" })
    ).resolves.toEqual([
      expect.objectContaining({
        beforeContent: "Acme can send plain-text email only.",
        operation: "delete",
      }),
      expect.objectContaining({
        afterContent: "Acme can send plain-text email only.",
        beforeContent: "Acme cannot send HTML email.",
        operation: "update",
      }),
      expect.objectContaining({
        afterContent: "Acme cannot send HTML email.",
        beforeContent: null,
        operation: "add",
      }),
    ]);
  });

  it("keeps sandbox memories and events private per visitor", async () => {
    const store = createCustomerMemoryStore({
      persistence: createInMemoryPersistence(),
    });

    await store.addMemory({
      category: "constraint",
      content: "Only visitor one should see this.",
      customerId: "demo-sandbox",
      title: "Private memory",
      visitorId: "visitor-1",
    });
    await store.addMemory({
      category: "constraint",
      content: "Only visitor two should see this.",
      customerId: "demo-sandbox",
      title: "Other memory",
      visitorId: "visitor-2",
    });

    await expect(
      store.listMemories({
        customerId: "demo-sandbox",
        visitorId: "visitor-1",
      })
    ).resolves.toEqual([
      expect.objectContaining({
        content: "Only visitor one should see this.",
        visitorId: "visitor-1",
      }),
    ]);
    await expect(
      store.listEvents({
        customerId: "demo-sandbox",
        visitorId: "visitor-1",
      })
    ).resolves.toEqual([
      expect.objectContaining({
        afterContent: "Only visitor one should see this.",
        operation: "add",
        visitorId: "visitor-1",
      }),
    ]);
  });

  it("rejects mutations when the memory owner does not match", async () => {
    const store = createCustomerMemoryStore({
      persistence: createInMemoryPersistence(),
    });

    const firstVisitorMemory = await store.addMemory({
      category: "constraint",
      content: "Only visitor one can change this.",
      customerId: "demo-sandbox",
      title: "Visitor one memory",
      visitorId: "visitor-1",
    });
    const secondVisitorMemory = await store.addMemory({
      category: "constraint",
      content: "Only visitor two can change this.",
      customerId: "demo-sandbox",
      title: "Visitor two memory",
      visitorId: "visitor-2",
    });

    await expect(
      store.updateMemory({
        content: "Cross-owner update should not land.",
        customerId: "demo-sandbox",
        memoryId: secondVisitorMemory.id,
        visitorId: "visitor-1",
      })
    ).rejects.toThrow(
      `No active customer memory found for ${secondVisitorMemory.id}.`
    );

    await expect(
      store.deleteMemory({
        customerId: "demo-sandbox",
        memoryId: secondVisitorMemory.id,
        visitorId: "visitor-1",
      })
    ).rejects.toThrow(
      `No active customer memory found for ${secondVisitorMemory.id}.`
    );

    await store.markMemoriesAccessed({
      customerId: "demo-sandbox",
      memoryIds: [secondVisitorMemory.id],
      visitorId: "visitor-1",
    });

    await expect(
      store.listMemories({
        customerId: "demo-sandbox",
        visitorId: "visitor-1",
      })
    ).resolves.toEqual([
      expect.objectContaining({
        accessCount: 0,
        id: firstVisitorMemory.id,
      }),
    ]);
    await expect(
      store.listMemories({
        customerId: "demo-sandbox",
        visitorId: "visitor-2",
      })
    ).resolves.toEqual([
      expect.objectContaining({
        accessCount: 0,
        id: secondVisitorMemory.id,
      }),
    ]);
  });
});
