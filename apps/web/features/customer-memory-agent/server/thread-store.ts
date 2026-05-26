import type { UIMessage } from "ai";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { loadCustomerMemoryAgentDatabase } from "./database";

export interface CustomerMemoryThreadRecord {
  createdAt: string;
  customerId: string;
  id: string;
  title: string | null;
  updatedAt: string;
  visitorId: string;
}

export interface PersistedCustomerMemoryMessage {
  createdAt: string;
  id: string;
  message: UIMessage;
  messageId: string;
  messageIndex: number;
  role: UIMessage["role"];
  threadId: string;
}

export interface CustomerMemoryThreadSnapshot {
  messages: UIMessage[];
  thread: CustomerMemoryThreadRecord;
}

export interface CustomerMemoryThreadSummary
  extends CustomerMemoryThreadRecord {
  messageCount: number;
}

export interface CustomerMemoryThreadPersistence {
  createThread(input: {
    customerId: string;
    title?: string | null;
    visitorId: string;
  }): Promise<CustomerMemoryThreadRecord>;
  findThreadById(threadId: string): Promise<CustomerMemoryThreadRecord | null>;
  loadThreadMessages(
    threadId: string
  ): Promise<PersistedCustomerMemoryMessage[]>;
  listThreadsForCustomer(input: {
    customerId: string;
    visitorId: string;
  }): Promise<CustomerMemoryThreadSummary[]>;
  replaceThreadMessages(input: {
    messages: UIMessage[];
    threadId: string;
  }): Promise<void>;
}

interface CustomerMemoryThreadStoreDependencies {
  persistence?: CustomerMemoryThreadPersistence;
}

interface CustomerMemoryThreadDatabaseModule {
  customerMemoryMessages: Awaited<
    ReturnType<typeof loadCustomerMemoryAgentDatabase>
  >["customerMemoryMessages"];
  customerMemoryThreads: Awaited<
    ReturnType<typeof loadCustomerMemoryAgentDatabase>
  >["customerMemoryThreads"];
  database: Awaited<
    ReturnType<typeof loadCustomerMemoryAgentDatabase>
  >["database"];
}

export function getMissingCustomerMemoryThreadError(threadId: string) {
  return `No customer-memory thread found for ${threadId}.`;
}

export function getInvalidCustomerMemoryMessageIdError(messageIndex: number) {
  return `Expected customer-memory message ${messageIndex} to have a non-empty id before persistence.`;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeThreadRecord(record: {
  createdAt: Date | string;
  customerId: string;
  id: string;
  title: string | null;
  updatedAt: Date | string;
  visitorId: string;
}): CustomerMemoryThreadRecord {
  return {
    createdAt: toIsoString(record.createdAt),
    customerId: record.customerId,
    id: record.id,
    title: record.title,
    updatedAt: toIsoString(record.updatedAt),
    visitorId: record.visitorId,
  };
}

function isInvalidCustomerMemoryThreadIdError(error: unknown) {
  const candidates =
    error instanceof Error
      ? [error, (error as Error & { cause?: unknown }).cause]
      : [error];

  return candidates.some((candidate) => {
    if (!(candidate instanceof Error)) {
      return false;
    }

    const candidateWithCode = candidate as Error & { code?: string };

    return (
      candidateWithCode.code === "22P02" ||
      candidate.message.includes("invalid input syntax for type uuid")
    );
  });
}

function createDatabaseBackedPersistence(): CustomerMemoryThreadPersistence {
  return {
    async createThread(input) {
      const { customerMemoryThreads, database } =
        await loadCustomerMemoryAgentDatabase();
      const [row] = await database
        .insert(customerMemoryThreads)
        .values({
          customerId: input.customerId,
          title: input.title ?? null,
          visitorId: input.visitorId,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to create a customer-memory thread.");
      }

      return normalizeThreadRecord(row);
    },
    async findThreadById(threadId) {
      const { customerMemoryThreads, database } =
        await loadCustomerMemoryAgentDatabase();
      const [row] = await database
        .select()
        .from(customerMemoryThreads)
        .where(eq(customerMemoryThreads.id, threadId))
        .limit(1);

      return row ? normalizeThreadRecord(row) : null;
    },
    async loadThreadMessages(threadId) {
      const { customerMemoryMessages, database } =
        await loadCustomerMemoryAgentDatabase();
      const rows = await database
        .select()
        .from(customerMemoryMessages)
        .where(eq(customerMemoryMessages.threadId, threadId))
        .orderBy(asc(customerMemoryMessages.messageIndex));

      return rows.map((row) => ({
        createdAt: toIsoString(row.createdAt),
        id: row.id,
        message: row.payload as UIMessage,
        messageId: row.messageId,
        messageIndex: row.messageIndex,
        role: row.role as UIMessage["role"],
        threadId: row.threadId,
      }));
    },
    async listThreadsForCustomer(input) {
      const { customerMemoryMessages, customerMemoryThreads, database } =
        await loadCustomerMemoryAgentDatabase();
      const rows = await database
        .select({
          createdAt: customerMemoryThreads.createdAt,
          customerId: customerMemoryThreads.customerId,
          id: customerMemoryThreads.id,
          messageCount:
            sql<number>`count(${customerMemoryMessages.id})`.mapWith(Number),
          title: customerMemoryThreads.title,
          updatedAt: customerMemoryThreads.updatedAt,
          visitorId: customerMemoryThreads.visitorId,
        })
        .from(customerMemoryThreads)
        .leftJoin(
          customerMemoryMessages,
          eq(customerMemoryMessages.threadId, customerMemoryThreads.id)
        )
        .where(
          and(
            eq(customerMemoryThreads.customerId, input.customerId),
            eq(customerMemoryThreads.visitorId, input.visitorId)
          )
        )
        .groupBy(customerMemoryThreads.id)
        .orderBy(desc(customerMemoryThreads.updatedAt));

      return rows.map((row) => ({
        ...normalizeThreadRecord(row),
        messageCount: row.messageCount,
      }));
    },
    async replaceThreadMessages(input) {
      const { customerMemoryMessages, customerMemoryThreads, database } =
        await loadCustomerMemoryAgentDatabase();
      const thread = await database
        .select({ id: customerMemoryThreads.id })
        .from(customerMemoryThreads)
        .where(eq(customerMemoryThreads.id, input.threadId))
        .limit(1);

      if (thread.length === 0) {
        throw new Error(getMissingCustomerMemoryThreadError(input.threadId));
      }

      await database.transaction(async (tx) => {
        await tx
          .delete(customerMemoryMessages)
          .where(eq(customerMemoryMessages.threadId, input.threadId));

        if (input.messages.length > 0) {
          await tx.insert(customerMemoryMessages).values(
            input.messages.map((message, messageIndex) => ({
              messageId: message.id,
              messageIndex,
              payload: message as unknown as Record<string, unknown>,
              role: message.role,
              threadId: input.threadId,
            }))
          );
        }

        await tx
          .update(customerMemoryThreads)
          .set({ updatedAt: new Date() })
          .where(eq(customerMemoryThreads.id, input.threadId));
      });
    },
  };
}

export function createCustomerMemoryThreadStore(
  dependencies: CustomerMemoryThreadStoreDependencies = {}
) {
  const persistence =
    dependencies.persistence ?? createDatabaseBackedPersistence();

  async function findThreadByIdSafely(threadId: string) {
    try {
      return await persistence.findThreadById(threadId);
    } catch (error) {
      if (isInvalidCustomerMemoryThreadIdError(error)) {
        return null;
      }

      throw error;
    }
  }

  return {
    async createThread(input: {
      customerId: string;
      title?: string | null;
      visitorId: string;
    }) {
      return persistence.createThread(input);
    },
    async loadThread(threadId: string): Promise<CustomerMemoryThreadSnapshot | null> {
      const thread = await findThreadByIdSafely(threadId);

      if (!thread) {
        return null;
      }

      const messages = await persistence.loadThreadMessages(threadId);

      return {
        messages: messages.map((message) => message.message),
        thread,
      };
    },
    async listThreads(input: { customerId: string; visitorId: string }) {
      return persistence.listThreadsForCustomer(input);
    },
    async loadThreadForViewer(input: {
      customerId: string;
      threadId: string;
      visitorId: string;
    }): Promise<CustomerMemoryThreadSnapshot | null> {
      const thread = await findThreadByIdSafely(input.threadId);

      if (
        !thread ||
        thread.customerId !== input.customerId ||
        thread.visitorId !== input.visitorId
      ) {
        return null;
      }

      const messages = await persistence.loadThreadMessages(input.threadId);

      return {
        messages: messages.map((message) => message.message),
        thread,
      };
    },
    async saveThreadMessages(input: {
      messages: UIMessage[];
      threadId: string;
    }) {
      const invalidMessageIndex = input.messages.findIndex(
        (message) => message.id.trim().length === 0
      );

      if (invalidMessageIndex >= 0) {
        throw new Error(
          getInvalidCustomerMemoryMessageIdError(invalidMessageIndex)
        );
      }

      const thread = await findThreadByIdSafely(input.threadId);

      if (!thread) {
        throw new Error(getMissingCustomerMemoryThreadError(input.threadId));
      }

      await persistence.replaceThreadMessages(input);
    },
  };
}
