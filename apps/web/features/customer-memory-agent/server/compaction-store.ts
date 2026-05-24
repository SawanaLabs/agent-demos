import { desc, eq } from "@workspace/database/drizzle";

export interface CustomerMemoryCompactionRecord {
  createdAt: string;
  id: string;
  messageCount: number;
  summary: string;
  threadId: string;
}

export interface CustomerMemoryCompactionPersistence {
  createCompaction(input: {
    messageCount: number;
    summary: string;
    threadId: string;
  }): Promise<CustomerMemoryCompactionRecord>;
  getLatestCompaction(
    threadId: string
  ): Promise<CustomerMemoryCompactionRecord | null>;
}

interface CustomerMemoryCompactionStoreDependencies {
  persistence?: CustomerMemoryCompactionPersistence;
}

interface CustomerMemoryDatabaseModule {
  customerMemoryCompactions: (typeof import("@workspace/database"))["customerMemoryCompactions"];
  database: (typeof import("@workspace/database"))["database"];
}

async function loadCustomerMemoryAgentDatabase(): Promise<CustomerMemoryDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    customerMemoryCompactions: databaseModule.customerMemoryCompactions,
    database: databaseModule.database,
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeCompactionRecord(record: {
  createdAt: Date | string;
  id: string;
  messageCount: number;
  summary: string;
  threadId: string;
}): CustomerMemoryCompactionRecord {
  return {
    createdAt: toIsoString(record.createdAt),
    id: record.id,
    messageCount: record.messageCount,
    summary: record.summary,
    threadId: record.threadId,
  };
}

function createDatabaseBackedPersistence(): CustomerMemoryCompactionPersistence {
  return {
    async createCompaction(input) {
      const { customerMemoryCompactions, database } =
        await loadCustomerMemoryAgentDatabase();
      const [row] = await database
        .insert(customerMemoryCompactions)
        .values({
          messageCount: input.messageCount,
          summary: input.summary,
          threadId: input.threadId,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to save a customer-memory compaction.");
      }

      return normalizeCompactionRecord(row);
    },
    async getLatestCompaction(threadId) {
      const { customerMemoryCompactions, database } =
        await loadCustomerMemoryAgentDatabase();
      const [row] = await database
        .select()
        .from(customerMemoryCompactions)
        .where(eq(customerMemoryCompactions.threadId, threadId))
        .orderBy(desc(customerMemoryCompactions.createdAt))
        .limit(1);

      return row ? normalizeCompactionRecord(row) : null;
    },
  };
}

export function shouldCompactCustomerMemoryThread(input: {
  messageCount: number;
  threshold: number;
}) {
  return input.messageCount >= input.threshold;
}

export function createCustomerMemoryCompactionStore(
  dependencies: CustomerMemoryCompactionStoreDependencies = {}
) {
  const persistence =
    dependencies.persistence ?? createDatabaseBackedPersistence();

  return {
    async getLatestCompaction(threadId: string) {
      return persistence.getLatestCompaction(threadId);
    },
    async saveCompaction(input: {
      messageCount: number;
      summary: string;
      threadId: string;
    }) {
      return persistence.createCompaction(input);
    },
  };
}
