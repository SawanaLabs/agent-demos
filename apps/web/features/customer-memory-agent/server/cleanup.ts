import { and, inArray, sql } from "drizzle-orm";

import { demoDataRetentionDays } from "@/features/shared/demo-data-retention/server/policy";

import { getVisitorPrivateCustomerMemoryProfileIds } from "../customer-profiles";
import { loadCustomerMemoryAgentDatabase } from "./database";
import { customerMemorySharedVisitorId } from "./viewer-context";

export const customerMemoryCleanupRetentionDays = demoDataRetentionDays;
export const customerMemoryCleanupCronScheduleUtc = "0 20 * * *";

export interface ExpiredCustomerMemoryThreadRecord {
  customerId: string;
  id: string;
  updatedAt: string;
  visitorId: string;
}

export interface CustomerMemoryCleanupResult {
  compactionsDeleted: number;
  cutoff: string;
  eventsDeleted: number;
  memoriesDeleted: number;
  messagesDeleted: number;
  retentionDays: number;
  threadIds: string[];
  threadsDeleted: number;
}

export interface CustomerMemoryCleanupPersistence {
  countCompactionsForThreads(threadIds: string[]): Promise<number>;
  countMemoriesForThreads(threadIds: string[]): Promise<number>;
  countMessagesForThreads(threadIds: string[]): Promise<number>;
  deleteEventsOlderThan(input: {
    customerIds: string[];
    olderThan: string;
  }): Promise<number>;
  deleteMemoriesForThreads(threadIds: string[]): Promise<number>;
  deleteThreadsByIds(threadIds: string[]): Promise<number>;
  findExpiredThreads(input: {
    customerIds: string[];
    olderThan: string;
  }): Promise<ExpiredCustomerMemoryThreadRecord[]>;
}

interface CustomerMemoryCleanupDependencies {
  persistence?: CustomerMemoryCleanupPersistence;
}

interface CustomerMemoryCleanupInput {
  now?: Date;
  retentionDays?: number;
  visitorPrivateCustomerIds?: string[];
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function createDatabaseBackedPersistence(): CustomerMemoryCleanupPersistence {
  return {
    async countCompactionsForThreads(threadIds) {
      if (threadIds.length === 0) {
        return 0;
      }

      const { customerMemoryCompactions, database } =
        await loadCustomerMemoryAgentDatabase();
      const [row] = await database
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(customerMemoryCompactions)
        .where(inArray(customerMemoryCompactions.threadId, threadIds));

      return row?.count ?? 0;
    },
    async countMemoriesForThreads(threadIds) {
      if (threadIds.length === 0) {
        return 0;
      }

      const { customerMemoryMemories, database } =
        await loadCustomerMemoryAgentDatabase();
      const [row] = await database
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(customerMemoryMemories)
        .where(inArray(customerMemoryMemories.threadId, threadIds));

      return row?.count ?? 0;
    },
    async countMessagesForThreads(threadIds) {
      if (threadIds.length === 0) {
        return 0;
      }

      const { customerMemoryMessages, database } =
        await loadCustomerMemoryAgentDatabase();
      const [row] = await database
        .select({
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(customerMemoryMessages)
        .where(inArray(customerMemoryMessages.threadId, threadIds));

      return row?.count ?? 0;
    },
    async deleteEventsOlderThan(input) {
      if (input.customerIds.length === 0) {
        return 0;
      }

      const { customerMemoryEvents, database } =
        await loadCustomerMemoryAgentDatabase();
      const rows = await database
        .delete(customerMemoryEvents)
        .where(
          and(
            inArray(customerMemoryEvents.customerId, input.customerIds),
            sql`${customerMemoryEvents.createdAt} < ${input.olderThan}`,
            sql`${customerMemoryEvents.visitorId} <> ${customerMemorySharedVisitorId}`
          )
        )
        .returning({ id: customerMemoryEvents.id });

      return rows.length;
    },
    async deleteMemoriesForThreads(threadIds) {
      if (threadIds.length === 0) {
        return 0;
      }

      const { customerMemoryMemories, database } =
        await loadCustomerMemoryAgentDatabase();
      const rows = await database
        .delete(customerMemoryMemories)
        .where(inArray(customerMemoryMemories.threadId, threadIds))
        .returning({ id: customerMemoryMemories.id });

      return rows.length;
    },
    async deleteThreadsByIds(threadIds) {
      if (threadIds.length === 0) {
        return 0;
      }

      const { customerMemoryThreads, database } =
        await loadCustomerMemoryAgentDatabase();
      const rows = await database
        .delete(customerMemoryThreads)
        .where(inArray(customerMemoryThreads.id, threadIds))
        .returning({ id: customerMemoryThreads.id });

      return rows.length;
    },
    async findExpiredThreads(input) {
      if (input.customerIds.length === 0) {
        return [];
      }

      const { customerMemoryThreads, database } =
        await loadCustomerMemoryAgentDatabase();
      const rows = await database
        .select({
          customerId: customerMemoryThreads.customerId,
          id: customerMemoryThreads.id,
          updatedAt: customerMemoryThreads.updatedAt,
          visitorId: customerMemoryThreads.visitorId,
        })
        .from(customerMemoryThreads)
        .where(
          and(
            inArray(customerMemoryThreads.customerId, input.customerIds),
            sql`${customerMemoryThreads.updatedAt} < ${input.olderThan}`,
            sql`${customerMemoryThreads.visitorId} <> ${customerMemorySharedVisitorId}`
          )
        );

      return rows.map((row) => ({
        customerId: row.customerId,
        id: row.id,
        updatedAt: toIsoString(row.updatedAt),
        visitorId: row.visitorId,
      }));
    },
  };
}

export async function cleanupExpiredCustomerMemoryThreads(
  input: CustomerMemoryCleanupInput = {},
  dependencies: CustomerMemoryCleanupDependencies = {}
): Promise<CustomerMemoryCleanupResult> {
  const visitorPrivateCustomerIds =
    input.visitorPrivateCustomerIds ??
    getVisitorPrivateCustomerMemoryProfileIds();

  if (visitorPrivateCustomerIds.length === 0) {
    throw new Error(
      "Customer-memory cleanup requires at least one visitor-private customer id."
    );
  }

  const now = input.now ?? new Date();
  const retentionDays =
    input.retentionDays ?? customerMemoryCleanupRetentionDays;
  const cutoff = subtractDays(now, retentionDays).toISOString();
  const persistence =
    dependencies.persistence ?? createDatabaseBackedPersistence();

  const [eventsDeleted, expiredThreads] = await Promise.all([
    persistence.deleteEventsOlderThan({
      customerIds: visitorPrivateCustomerIds,
      olderThan: cutoff,
    }),
    persistence.findExpiredThreads({
      customerIds: visitorPrivateCustomerIds,
      olderThan: cutoff,
    }),
  ]);
  const threadIds = expiredThreads.map((thread) => thread.id);

  if (threadIds.length === 0) {
    return {
      compactionsDeleted: 0,
      cutoff,
      eventsDeleted,
      memoriesDeleted: 0,
      messagesDeleted: 0,
      retentionDays,
      threadIds: [],
      threadsDeleted: 0,
    };
  }

  const [messagesDeleted, memoriesDeleted, compactionsDeleted] =
    await Promise.all([
      persistence.countMessagesForThreads(threadIds),
      persistence.countMemoriesForThreads(threadIds),
      persistence.countCompactionsForThreads(threadIds),
    ]);

  await persistence.deleteMemoriesForThreads(threadIds);
  const threadsDeleted = await persistence.deleteThreadsByIds(threadIds);

  return {
    compactionsDeleted,
    cutoff,
    eventsDeleted,
    memoriesDeleted,
    messagesDeleted,
    retentionDays,
    threadIds,
    threadsDeleted,
  };
}
