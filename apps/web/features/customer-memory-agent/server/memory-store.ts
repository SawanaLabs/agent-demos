import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { loadCustomerMemoryAgentDatabase } from "./database";

export const customerMemoryStatuses = ["active", "updated", "deleted"] as const;
export const customerMemoryOperations = [
  "add",
  "update",
  "delete",
  "search_hit",
  "compact_capture",
  "noop",
] as const;

export type CustomerMemoryStatus = (typeof customerMemoryStatuses)[number];
export type CustomerMemoryOperation = (typeof customerMemoryOperations)[number];
export type CustomerMemoryMetadata = Record<string, unknown> | null;

export interface CustomerMemoryRecord {
  accessCount: number;
  category: string;
  content: string;
  createdAt: string;
  customerId: string;
  id: string;
  lastAccessedAt: string | null;
  metadata: CustomerMemoryMetadata;
  sourceMessageId: string | null;
  status: CustomerMemoryStatus;
  threadId: string | null;
  title: string | null;
  updatedAt: string;
  visitorId: string;
}

export interface CustomerMemoryEventRecord {
  afterContent: string | null;
  beforeContent: string | null;
  createdAt: string;
  customerId: string;
  id: string;
  memoryId: string | null;
  metadata: CustomerMemoryMetadata;
  operation: CustomerMemoryOperation;
  reason: string | null;
  sourceMessageId: string | null;
  threadId: string | null;
  visitorId: string;
}

export interface CustomerMemoryMemoryPersistence {
  createMemory(input: {
    category: string;
    content: string;
    customerId: string;
    metadata?: CustomerMemoryMetadata;
    reason?: string | null;
    sourceMessageId?: string | null;
    threadId?: string | null;
    title?: string | null;
    visitorId: string;
  }): Promise<CustomerMemoryRecord>;
  deleteMemory(input: {
    customerId: string;
    memoryId: string;
    reason?: string | null;
    sourceMessageId?: string | null;
    visitorId: string;
  }): Promise<void>;
  listEventsForCustomer(input: {
    customerId: string;
    visitorId: string;
  }): Promise<CustomerMemoryEventRecord[]>;
  listVisibleMemoriesForCustomer(input: {
    customerId: string;
    visitorId: string;
  }): Promise<CustomerMemoryRecord[]>;
  markMemoryAccessed(input: {
    customerId: string;
    memoryIds: string[];
    visitorId: string;
  }): Promise<void>;
  recordEvent(input: {
    afterContent?: string | null;
    beforeContent?: string | null;
    customerId: string;
    memoryId?: string | null;
    metadata?: CustomerMemoryMetadata;
    operation: CustomerMemoryOperation;
    reason?: string | null;
    sourceMessageId?: string | null;
    threadId?: string | null;
    visitorId: string;
  }): Promise<CustomerMemoryEventRecord>;
  updateMemory(input: {
    category?: string;
    content: string;
    customerId: string;
    memoryId: string;
    metadata?: CustomerMemoryMetadata;
    reason?: string | null;
    sourceMessageId?: string | null;
    title?: string | null;
    visitorId: string;
  }): Promise<CustomerMemoryRecord>;
}

interface CustomerMemoryStoreDependencies {
  persistence?: CustomerMemoryMemoryPersistence;
}

interface CustomerMemoryDatabaseModule {
  customerMemoryEvents: Awaited<
    ReturnType<typeof loadCustomerMemoryAgentDatabase>
  >["customerMemoryEvents"];
  customerMemoryMemories: Awaited<
    ReturnType<typeof loadCustomerMemoryAgentDatabase>
  >["customerMemoryMemories"];
  database: Awaited<
    ReturnType<typeof loadCustomerMemoryAgentDatabase>
  >["database"];
}

function toIsoString(value: Date | string | null) {
  if (value === null) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function normalizeStatus(value: string): CustomerMemoryStatus {
  if (customerMemoryStatuses.includes(value as CustomerMemoryStatus)) {
    return value as CustomerMemoryStatus;
  }

  throw new Error(`Unknown customer-memory status: ${value}`);
}

function normalizeOperation(value: string): CustomerMemoryOperation {
  if (customerMemoryOperations.includes(value as CustomerMemoryOperation)) {
    return value as CustomerMemoryOperation;
  }

  throw new Error(`Unknown customer-memory operation: ${value}`);
}

function normalizeMetadata(value: unknown): CustomerMemoryMetadata {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Customer-memory metadata must be a JSON object.");
  }

  return value as Record<string, unknown>;
}

function normalizeMemoryRecord(record: {
  accessCount: number;
  category: string;
  content: string;
  createdAt: Date | string;
  customerId: string;
  id: string;
  lastAccessedAt: Date | string | null;
  metadata: unknown;
  sourceMessageId: string | null;
  status: string;
  threadId: string | null;
  title: string | null;
  updatedAt: Date | string;
  visitorId: string;
}): CustomerMemoryRecord {
  return {
    accessCount: record.accessCount,
    category: record.category,
    content: record.content,
    createdAt: toIsoString(record.createdAt) ?? "",
    customerId: record.customerId,
    id: record.id,
    lastAccessedAt: toIsoString(record.lastAccessedAt),
    metadata: normalizeMetadata(record.metadata),
    sourceMessageId: record.sourceMessageId,
    status: normalizeStatus(record.status),
    threadId: record.threadId,
    title: record.title,
    updatedAt: toIsoString(record.updatedAt) ?? "",
    visitorId: record.visitorId,
  };
}

function normalizeEventRecord(record: {
  afterContent: string | null;
  beforeContent: string | null;
  createdAt: Date | string;
  customerId: string;
  id: string;
  memoryId: string | null;
  metadata: unknown;
  operation: string;
  reason: string | null;
  sourceMessageId: string | null;
  threadId: string | null;
  visitorId: string;
}): CustomerMemoryEventRecord {
  return {
    afterContent: record.afterContent,
    beforeContent: record.beforeContent,
    createdAt: toIsoString(record.createdAt) ?? "",
    customerId: record.customerId,
    id: record.id,
    memoryId: record.memoryId,
    metadata: normalizeMetadata(record.metadata),
    operation: normalizeOperation(record.operation),
    reason: record.reason,
    sourceMessageId: record.sourceMessageId,
    threadId: record.threadId,
    visitorId: record.visitorId,
  };
}

async function insertMemoryEvent(
  input: Parameters<CustomerMemoryMemoryPersistence["recordEvent"]>[0],
  databaseModule: CustomerMemoryDatabaseModule
) {
  const [row] = await databaseModule.database
    .insert(databaseModule.customerMemoryEvents)
    .values({
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
    .returning();

  if (!row) {
    throw new Error("Failed to save a customer-memory event.");
  }

  return normalizeEventRecord(row);
}

async function getMemoryForMutation(
  input: { customerId: string; memoryId: string; visitorId: string },
  databaseModule: CustomerMemoryDatabaseModule
) {
  const [row] = await databaseModule.database
    .select()
    .from(databaseModule.customerMemoryMemories)
    .where(
      and(
        eq(databaseModule.customerMemoryMemories.id, input.memoryId),
        eq(databaseModule.customerMemoryMemories.customerId, input.customerId),
        eq(databaseModule.customerMemoryMemories.visitorId, input.visitorId),
        ne(databaseModule.customerMemoryMemories.status, "deleted")
      )
    )
    .limit(1);

  if (!row) {
    throw new Error(`No active customer memory found for ${input.memoryId}.`);
  }

  return row;
}

type CreateMemoryInput = Parameters<
  CustomerMemoryMemoryPersistence["createMemory"]
>[0];
type DeleteMemoryInput = Parameters<
  CustomerMemoryMemoryPersistence["deleteMemory"]
>[0];
type ListCustomerMemoriesInput = Parameters<
  CustomerMemoryMemoryPersistence["listVisibleMemoriesForCustomer"]
>[0];
type MarkMemoryAccessedInput = Parameters<
  CustomerMemoryMemoryPersistence["markMemoryAccessed"]
>[0];
type UpdateMemoryInput = Parameters<
  CustomerMemoryMemoryPersistence["updateMemory"]
>[0];

function createTransactionModule(
  databaseModule: CustomerMemoryDatabaseModule,
  transaction: unknown
): CustomerMemoryDatabaseModule {
  return {
    ...databaseModule,
    database: transaction as CustomerMemoryDatabaseModule["database"],
  };
}

async function createDatabaseMemory(
  input: CreateMemoryInput
): Promise<CustomerMemoryRecord> {
  const databaseModule = await loadCustomerMemoryAgentDatabase();
  let savedMemory: CustomerMemoryRecord | null = null;

  await databaseModule.database.transaction(async (transaction) => {
    const [row] = await transaction
      .insert(databaseModule.customerMemoryMemories)
      .values({
        category: input.category,
        content: input.content,
        customerId: input.customerId,
        metadata: input.metadata ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        threadId: input.threadId ?? null,
        title: input.title ?? null,
        visitorId: input.visitorId,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to save a customer memory.");
    }

    await insertMemoryEvent(
      {
        afterContent: row.content,
        beforeContent: null,
        customerId: row.customerId,
        memoryId: row.id,
        metadata: normalizeMetadata(row.metadata),
        operation: "add",
        reason: input.reason ?? null,
        sourceMessageId: row.sourceMessageId,
        threadId: row.threadId,
        visitorId: row.visitorId,
      },
      createTransactionModule(databaseModule, transaction)
    );
    savedMemory = normalizeMemoryRecord(row);
  });

  if (!savedMemory) {
    throw new Error("Failed to save a customer memory.");
  }

  return savedMemory;
}

async function deleteDatabaseMemory(input: DeleteMemoryInput): Promise<void> {
  const databaseModule = await loadCustomerMemoryAgentDatabase();

  await databaseModule.database.transaction(async (transaction) => {
    const transactionModule = createTransactionModule(
      databaseModule,
      transaction
    );
    const current = await getMemoryForMutation(input, transactionModule);
    await transaction
      .update(databaseModule.customerMemoryMemories)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(
        and(
          eq(databaseModule.customerMemoryMemories.id, input.memoryId),
          eq(
            databaseModule.customerMemoryMemories.customerId,
            input.customerId
          ),
          eq(databaseModule.customerMemoryMemories.visitorId, input.visitorId)
        )
      );

    await insertMemoryEvent(
      {
        afterContent: null,
        beforeContent: current.content,
        customerId: current.customerId,
        memoryId: current.id,
        metadata: normalizeMetadata(current.metadata),
        operation: "delete",
        reason: input.reason ?? null,
        sourceMessageId: input.sourceMessageId ?? current.sourceMessageId,
        threadId: current.threadId,
        visitorId: current.visitorId,
      },
      transactionModule
    );
  });
}

async function listDatabaseEventsForCustomer(
  input: ListCustomerMemoriesInput
): Promise<CustomerMemoryEventRecord[]> {
  const { customerMemoryEvents, database } =
    await loadCustomerMemoryAgentDatabase();
  const rows = await database
    .select()
    .from(customerMemoryEvents)
    .where(
      and(
        eq(customerMemoryEvents.customerId, input.customerId),
        eq(customerMemoryEvents.visitorId, input.visitorId)
      )
    )
    .orderBy(desc(customerMemoryEvents.createdAt));

  return rows.map(normalizeEventRecord);
}

async function listDatabaseVisibleMemoriesForCustomer(
  input: ListCustomerMemoriesInput
): Promise<CustomerMemoryRecord[]> {
  const { customerMemoryMemories, database } =
    await loadCustomerMemoryAgentDatabase();
  const rows = await database
    .select()
    .from(customerMemoryMemories)
    .where(
      and(
        eq(customerMemoryMemories.customerId, input.customerId),
        eq(customerMemoryMemories.visitorId, input.visitorId),
        ne(customerMemoryMemories.status, "deleted")
      )
    )
    .orderBy(desc(customerMemoryMemories.updatedAt));

  return rows.map(normalizeMemoryRecord);
}

async function markDatabaseMemoryAccessed(
  input: MarkMemoryAccessedInput
): Promise<void> {
  if (input.memoryIds.length === 0) {
    return;
  }

  const { customerMemoryMemories, database } =
    await loadCustomerMemoryAgentDatabase();
  await database
    .update(customerMemoryMemories)
    .set({
      accessCount: sql`${customerMemoryMemories.accessCount} + 1`,
      lastAccessedAt: new Date(),
    })
    .where(
      and(
        inArray(customerMemoryMemories.id, input.memoryIds),
        eq(customerMemoryMemories.customerId, input.customerId),
        eq(customerMemoryMemories.visitorId, input.visitorId),
        ne(customerMemoryMemories.status, "deleted")
      )
    );
}

async function updateDatabaseMemory(
  input: UpdateMemoryInput
): Promise<CustomerMemoryRecord> {
  const databaseModule = await loadCustomerMemoryAgentDatabase();
  let savedMemory: CustomerMemoryRecord | null = null;

  await databaseModule.database.transaction(async (transaction) => {
    const transactionModule = createTransactionModule(
      databaseModule,
      transaction
    );
    const current = await getMemoryForMutation(input, transactionModule);
    const [row] = await transaction
      .update(databaseModule.customerMemoryMemories)
      .set({
        category: input.category ?? current.category,
        content: input.content,
        metadata: input.metadata ?? current.metadata,
        sourceMessageId: input.sourceMessageId ?? current.sourceMessageId,
        status: "updated",
        title: input.title ?? current.title,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(databaseModule.customerMemoryMemories.id, input.memoryId),
          eq(
            databaseModule.customerMemoryMemories.customerId,
            input.customerId
          ),
          eq(databaseModule.customerMemoryMemories.visitorId, input.visitorId)
        )
      )
      .returning();

    if (!row) {
      throw new Error(`Failed to update customer memory ${input.memoryId}.`);
    }

    await insertMemoryEvent(
      {
        afterContent: row.content,
        beforeContent: current.content,
        customerId: row.customerId,
        memoryId: row.id,
        metadata: normalizeMetadata(row.metadata),
        operation: "update",
        reason: input.reason ?? null,
        sourceMessageId: row.sourceMessageId,
        threadId: row.threadId,
        visitorId: row.visitorId,
      },
      transactionModule
    );
    savedMemory = normalizeMemoryRecord(row);
  });

  if (!savedMemory) {
    throw new Error(`Failed to update customer memory ${input.memoryId}.`);
  }

  return savedMemory;
}

function createDatabaseBackedPersistence(): CustomerMemoryMemoryPersistence {
  return {
    createMemory: createDatabaseMemory,
    deleteMemory: deleteDatabaseMemory,
    listEventsForCustomer: listDatabaseEventsForCustomer,
    listVisibleMemoriesForCustomer: listDatabaseVisibleMemoriesForCustomer,
    markMemoryAccessed: markDatabaseMemoryAccessed,
    recordEvent: async (input) =>
      insertMemoryEvent(input, await loadCustomerMemoryAgentDatabase()),
    updateMemory: updateDatabaseMemory,
  };
}

export function createCustomerMemoryStore(
  dependencies: CustomerMemoryStoreDependencies = {}
) {
  const persistence =
    dependencies.persistence ?? createDatabaseBackedPersistence();

  return {
    addMemory: persistence.createMemory,
    deleteMemory: persistence.deleteMemory,
    listEvents: persistence.listEventsForCustomer,
    listMemories: persistence.listVisibleMemoriesForCustomer,
    markMemoriesAccessed: persistence.markMemoryAccessed,
    recordEvent: persistence.recordEvent,
    updateMemory: persistence.updateMemory,
  };
}
