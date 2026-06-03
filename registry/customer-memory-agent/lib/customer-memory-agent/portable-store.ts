import type { UIMessage } from "ai";

import type {
  CustomerMemoryCompactionPersistence,
  CustomerMemoryCompactionRecord,
} from "./compaction-store";
import type {
  CustomerMemoryEventRecord,
  CustomerMemoryMemoryPersistence,
  CustomerMemoryMetadata,
  CustomerMemoryRecord,
} from "./memory-store";
import type {
  CustomerMemoryThreadPersistence,
  CustomerMemoryThreadRecord,
  CustomerMemoryThreadSummary,
  PersistedCustomerMemoryMessage,
} from "./thread-store";

interface PortableCustomerMemoryState {
  compactions: CustomerMemoryCompactionRecord[];
  events: CustomerMemoryEventRecord[];
  memories: Map<string, CustomerMemoryRecord>;
  messagesByThreadId: Map<string, PersistedCustomerMemoryMessage[]>;
  threads: Map<string, CustomerMemoryThreadRecord>;
}

const globalStore = globalThis as typeof globalThis & {
  __customerMemoryPortableStore?: PortableCustomerMemoryState;
};

function getPortableState(): PortableCustomerMemoryState {
  globalStore.__customerMemoryPortableStore ??= {
    compactions: [],
    events: [],
    memories: new Map(),
    messagesByThreadId: new Map(),
    threads: new Map(),
  };

  return globalStore.__customerMemoryPortableStore;
}

function createPortableId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIsoString() {
  return new Date().toISOString();
}

function cloneRecord<T>(value: T): T {
  return structuredClone(value);
}

function normalizeMetadata(
  metadata: CustomerMemoryMetadata | undefined
): CustomerMemoryMetadata {
  return metadata ?? null;
}

function createMemoryEventRecord(input: {
  afterContent?: string | null;
  beforeContent?: string | null;
  customerId: string;
  memoryId?: string | null;
  metadata?: CustomerMemoryMetadata;
  operation: CustomerMemoryEventRecord["operation"];
  reason?: string | null;
  sourceMessageId?: string | null;
  threadId?: string | null;
  visitorId: string;
}): CustomerMemoryEventRecord {
  return {
    afterContent: input.afterContent ?? null,
    beforeContent: input.beforeContent ?? null,
    createdAt: nowIsoString(),
    customerId: input.customerId,
    id: createPortableId("cm-event"),
    memoryId: input.memoryId ?? null,
    metadata: normalizeMetadata(input.metadata),
    operation: input.operation,
    reason: input.reason ?? null,
    sourceMessageId: input.sourceMessageId ?? null,
    threadId: input.threadId ?? null,
    visitorId: input.visitorId,
  };
}

function pushMemoryEvent(
  state: PortableCustomerMemoryState,
  input: Parameters<CustomerMemoryMemoryPersistence["recordEvent"]>[0]
) {
  const event = createMemoryEventRecord(input);
  state.events.push(event);
  return cloneRecord(event);
}

export function createPortableCustomerMemoryThreadPersistence(): CustomerMemoryThreadPersistence {
  const state = getPortableState();

  return {
    async createThread(input) {
      const timestamp = nowIsoString();
      const thread: CustomerMemoryThreadRecord = {
        createdAt: timestamp,
        customerId: input.customerId,
        id: createPortableId("cm-thread"),
        title: input.title ?? null,
        updatedAt: timestamp,
        visitorId: input.visitorId,
      };

      state.threads.set(thread.id, thread);
      state.messagesByThreadId.set(thread.id, []);

      return cloneRecord(thread);
    },
    async findThreadById(threadId) {
      const thread = state.threads.get(threadId);
      return thread ? cloneRecord(thread) : null;
    },
    async loadThreadMessages(threadId) {
      return cloneRecord(state.messagesByThreadId.get(threadId) ?? []);
    },
    async listThreadsForCustomer(input) {
      return [...state.threads.values()]
        .filter(
          (thread) =>
            thread.customerId === input.customerId &&
            thread.visitorId === input.visitorId
        )
        .map(
          (thread): CustomerMemoryThreadSummary => ({
            ...thread,
            messageCount: state.messagesByThreadId.get(thread.id)?.length ?? 0,
          })
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(cloneRecord);
    },
    async replaceThreadMessages(input) {
      const thread = state.threads.get(input.threadId);

      if (!thread) {
        throw new Error(`No customer-memory thread found for ${input.threadId}.`);
      }

      const timestamp = nowIsoString();
      state.messagesByThreadId.set(
        input.threadId,
        input.messages.map((message, messageIndex) => ({
          createdAt: timestamp,
          id: createPortableId("cm-message"),
          message: cloneRecord(message),
          messageId: message.id,
          messageIndex,
          role: message.role,
          threadId: input.threadId,
        }))
      );
      state.threads.set(input.threadId, { ...thread, updatedAt: timestamp });
    },
  };
}

export function createPortableCustomerMemoryPersistence(): CustomerMemoryMemoryPersistence {
  const state = getPortableState();

  return {
    async createMemory(input) {
      const timestamp = nowIsoString();
      const memory: CustomerMemoryRecord = {
        accessCount: 0,
        category: input.category,
        content: input.content,
        createdAt: timestamp,
        customerId: input.customerId,
        id: createPortableId("cm-memory"),
        lastAccessedAt: null,
        metadata: normalizeMetadata(input.metadata),
        sourceMessageId: input.sourceMessageId ?? null,
        status: "active",
        threadId: input.threadId ?? null,
        title: input.title ?? null,
        updatedAt: timestamp,
        visitorId: input.visitorId,
      };

      state.memories.set(memory.id, memory);
      pushMemoryEvent(state, {
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

      return cloneRecord(memory);
    },
    async deleteMemory(input) {
      const current = state.memories.get(input.memoryId);

      if (!current || current.status === "deleted") {
        throw new Error(`No active customer memory found for ${input.memoryId}.`);
      }

      const next = {
        ...current,
        status: "deleted" as const,
        updatedAt: nowIsoString(),
      };
      state.memories.set(input.memoryId, next);
      pushMemoryEvent(state, {
        afterContent: null,
        beforeContent: current.content,
        customerId: current.customerId,
        memoryId: current.id,
        metadata: current.metadata,
        operation: "delete",
        reason: input.reason ?? null,
        sourceMessageId: input.sourceMessageId ?? current.sourceMessageId,
        threadId: current.threadId,
        visitorId: current.visitorId,
      });
    },
    async listEventsForCustomer(input) {
      return state.events
        .filter(
          (event) =>
            event.customerId === input.customerId &&
            event.visitorId === input.visitorId
        )
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .map(cloneRecord);
    },
    async listVisibleMemoriesForCustomer(input) {
      return [...state.memories.values()]
        .filter(
          (memory) =>
            memory.customerId === input.customerId &&
            memory.visitorId === input.visitorId &&
            memory.status !== "deleted"
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(cloneRecord);
    },
    async markMemoryAccessed(memoryIds) {
      const timestamp = nowIsoString();

      for (const memoryId of memoryIds) {
        const memory = state.memories.get(memoryId);

        if (!memory || memory.status === "deleted") {
          continue;
        }

        state.memories.set(memoryId, {
          ...memory,
          accessCount: memory.accessCount + 1,
          lastAccessedAt: timestamp,
        });
      }
    },
    async recordEvent(input) {
      return pushMemoryEvent(state, input);
    },
    async updateMemory(input) {
      const current = state.memories.get(input.memoryId);

      if (!current || current.status === "deleted") {
        throw new Error(`No active customer memory found for ${input.memoryId}.`);
      }

      const next: CustomerMemoryRecord = {
        ...current,
        category: input.category ?? current.category,
        content: input.content,
        metadata: normalizeMetadata(input.metadata ?? current.metadata),
        sourceMessageId: input.sourceMessageId ?? current.sourceMessageId,
        status: "updated",
        title: input.title ?? current.title,
        updatedAt: nowIsoString(),
      };

      state.memories.set(input.memoryId, next);
      pushMemoryEvent(state, {
        afterContent: next.content,
        beforeContent: current.content,
        customerId: next.customerId,
        memoryId: next.id,
        metadata: next.metadata,
        operation: "update",
        reason: input.reason ?? null,
        sourceMessageId: next.sourceMessageId,
        threadId: next.threadId,
        visitorId: next.visitorId,
      });

      return cloneRecord(next);
    },
  };
}

export function createPortableCustomerMemoryCompactionPersistence(): CustomerMemoryCompactionPersistence {
  const state = getPortableState();

  return {
    async createCompaction(input) {
      const compaction: CustomerMemoryCompactionRecord = {
        createdAt: nowIsoString(),
        id: createPortableId("cm-compaction"),
        messageCount: input.messageCount,
        summary: input.summary,
        threadId: input.threadId,
      };

      state.compactions.push(compaction);

      return cloneRecord(compaction);
    },
    async getLatestCompaction(threadId) {
      const compaction = state.compactions
        .filter((candidate) => candidate.threadId === threadId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];

      return compaction ? cloneRecord(compaction) : null;
    },
  };
}
