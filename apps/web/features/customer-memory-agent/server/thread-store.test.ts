import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  type CustomerMemoryThreadPersistence,
  type CustomerMemoryThreadRecord,
  createCustomerMemoryThreadStore,
  getInvalidCustomerMemoryMessageIdError,
  getMissingCustomerMemoryThreadError,
  type PersistedCustomerMemoryMessage,
} from "./thread-store";

function createInMemoryPersistence(): CustomerMemoryThreadPersistence {
  const threads = new Map<string, CustomerMemoryThreadRecord>();
  const messagesByThreadId = new Map<
    string,
    PersistedCustomerMemoryMessage[]
  >();
  let threadCounter = 0;
  let messageCounter = 0;

  return {
    async createThread(input) {
      threadCounter += 1;
      const timestamp = new Date(
        `2026-05-23T00:00:${String(threadCounter).padStart(2, "0")}Z`
      ).toISOString();
      const thread = {
        createdAt: timestamp,
        customerId: input.customerId,
        id: `thread-${threadCounter}`,
        title: input.title ?? null,
        updatedAt: timestamp,
        visitorId: input.visitorId,
      };

      threads.set(thread.id, thread);
      return thread;
    },
    async findThreadById(threadId) {
      return threads.get(threadId) ?? null;
    },
    async loadThreadMessages(threadId) {
      return messagesByThreadId.get(threadId) ?? [];
    },
    async listThreadsForCustomer(input) {
      return [...threads.values()]
        .filter(
          (thread) =>
            thread.customerId === input.customerId &&
            thread.visitorId === input.visitorId
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map((thread) => ({
          ...thread,
          messageCount: messagesByThreadId.get(thread.id)?.length ?? 0,
        }));
    },
    async replaceThreadMessages(input) {
      const thread = threads.get(input.threadId);

      if (!thread) {
        throw new Error(getMissingCustomerMemoryThreadError(input.threadId));
      }

      const persistedMessages = input.messages.map((message, index) => {
        messageCounter += 1;

        return {
          createdAt: new Date(
            `2026-05-23T00:10:${String(messageCounter).padStart(2, "0")}Z`
          ).toISOString(),
          id: `message-${messageCounter}`,
          message,
          messageId: message.id,
          messageIndex: index,
          role: message.role,
          threadId: input.threadId,
        };
      });

      messagesByThreadId.set(input.threadId, persistedMessages);
      threads.set(input.threadId, {
        ...thread,
        updatedAt: new Date("2026-05-23T00:20:00Z").toISOString(),
      });
    },
  };
}

function createMessages(): UIMessage[] {
  return [
    {
      id: "user-1",
      parts: [{ text: "Acme cannot send HTML email.", type: "text" }],
      role: "user",
    },
    {
      id: "assistant-1",
      parts: [
        {
          text: "Understood. I will remember the plain-text requirement.",
          type: "text",
        },
      ],
      role: "assistant",
    },
  ];
}

describe("customer memory thread store", () => {
  it("creates a customer thread, saves UI messages, and restores them in order", async () => {
    const store = createCustomerMemoryThreadStore({
      persistence: createInMemoryPersistence(),
    });

    const thread = await store.createThread({
      customerId: "acme-co",
      title: "Acme support memory",
      visitorId: "demo-shared",
    });

    await store.saveThreadMessages({
      messages: createMessages(),
      threadId: thread.id,
    });

    await expect(store.loadThread(thread.id)).resolves.toEqual({
      messages: createMessages(),
      thread: {
        createdAt: "2026-05-23T00:00:01.000Z",
        customerId: "acme-co",
        id: thread.id,
        title: "Acme support memory",
        updatedAt: "2026-05-23T00:20:00.000Z",
        visitorId: "demo-shared",
      },
    });
  });

  it("throws an explicit error when saving messages for a missing thread", async () => {
    const store = createCustomerMemoryThreadStore({
      persistence: createInMemoryPersistence(),
    });

    await expect(
      store.saveThreadMessages({
        messages: createMessages(),
        threadId: "missing-thread",
      })
    ).rejects.toThrow(getMissingCustomerMemoryThreadError("missing-thread"));
  });

  it("throws an explicit error before persistence when a message id is empty", async () => {
    const store = createCustomerMemoryThreadStore({
      persistence: createInMemoryPersistence(),
    });
    const thread = await store.createThread({
      customerId: "acme-co",
      title: "Acme support memory",
      visitorId: "demo-shared",
    });
    const firstMessage = createMessages().at(0);

    if (!firstMessage) {
      throw new Error("Expected a fixture message.");
    }

    await expect(
      store.saveThreadMessages({
        messages: [
          firstMessage,
          {
            id: "",
            parts: [{ text: "Understood.", type: "text" }],
            role: "assistant",
          },
        ],
        threadId: thread.id,
      })
    ).rejects.toThrow(getInvalidCustomerMemoryMessageIdError(1));
  });

  it("lists customer threads in newest-first order with message counts", async () => {
    const store = createCustomerMemoryThreadStore({
      persistence: createInMemoryPersistence(),
    });

    const olderThread = await store.createThread({
      customerId: "acme-co",
      title: "Older thread",
      visitorId: "demo-shared",
    });
    const newerThread = await store.createThread({
      customerId: "acme-co",
      title: "Newer thread",
      visitorId: "demo-shared",
    });

    await store.saveThreadMessages({
      messages: createMessages(),
      threadId: newerThread.id,
    });

    await expect(
      store.listThreads({ customerId: "acme-co", visitorId: "demo-shared" })
    ).resolves.toEqual([
      {
        createdAt: "2026-05-23T00:00:02.000Z",
        customerId: "acme-co",
        id: newerThread.id,
        messageCount: 2,
        title: "Newer thread",
        updatedAt: "2026-05-23T00:20:00.000Z",
        visitorId: "demo-shared",
      },
      {
        createdAt: "2026-05-23T00:00:01.000Z",
        customerId: "acme-co",
        id: olderThread.id,
        messageCount: 0,
        title: "Older thread",
        updatedAt: "2026-05-23T00:00:01.000Z",
        visitorId: "demo-shared",
      },
    ]);
  });

  it("isolates sandbox threads by visitor id", async () => {
    const store = createCustomerMemoryThreadStore({
      persistence: createInMemoryPersistence(),
    });

    const visitorOneThread = await store.createThread({
      customerId: "demo-sandbox",
      title: "Visitor one thread",
      visitorId: "visitor-1",
    });
    await store.createThread({
      customerId: "demo-sandbox",
      title: "Visitor two thread",
      visitorId: "visitor-2",
    });

    await expect(
      store.listThreads({
        customerId: "demo-sandbox",
        visitorId: "visitor-1",
      })
    ).resolves.toEqual([
      {
        createdAt: "2026-05-23T00:00:01.000Z",
        customerId: "demo-sandbox",
        id: visitorOneThread.id,
        messageCount: 0,
        title: "Visitor one thread",
        updatedAt: "2026-05-23T00:00:01.000Z",
        visitorId: "visitor-1",
      },
    ]);
  });

  it("treats stale non-uuid thread ids as missing when loading a viewer-scoped thread", async () => {
    const store = createCustomerMemoryThreadStore({
      persistence: {
        ...createInMemoryPersistence(),
        async findThreadById() {
          const cause = new Error("invalid input syntax for type uuid");
          Object.assign(cause, { code: "22P02" });
          const error = new Error("Failed query");
          Object.assign(error, { cause });
          throw error;
        },
      },
    });

    await expect(
      store.loadThreadForViewer({
        customerId: "demo-sandbox",
        threadId: "cm-thread-brightfield-default",
        visitorId: "visitor-1",
      })
    ).resolves.toBeNull();
  });
});
