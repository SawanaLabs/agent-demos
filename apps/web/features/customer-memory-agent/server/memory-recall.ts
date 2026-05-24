import {
  and,
  cosineDistance,
  desc,
  eq,
  gt,
  inArray,
  ne,
  sql,
} from "@workspace/database/drizzle";
import { embed, embedMany } from "ai";
import { env as appEnv } from "@/env";

import { createAiGateway } from "@/features/shared/ai-gateway/server/env";

import {
  type CustomerMemoryRecord,
  createCustomerMemoryStore,
} from "./memory-store";

type DemoEnv = Record<string, string | undefined>;

const embeddingModelId = "openai/text-embedding-3-small";
const memoryRecallLimit = 4;
const minimumSimilarity = 0.6;

export interface CustomerMemoryEmbeddingRecord {
  content: string;
  embedding: number[];
  memoryId: string;
}

export interface RetrievedCustomerMemory extends CustomerMemoryRecord {
  similarity: number;
}

export interface CustomerMemoryEmbeddingPersistence {
  findMatches(input: {
    customerId: string;
    queryEmbedding: number[];
    visitorId: string;
  }): Promise<RetrievedCustomerMemory[]>;
  replaceEmbeddings(records: CustomerMemoryEmbeddingRecord[]): Promise<void>;
}

interface FindRelevantCustomerMemoryInput {
  customerId: string;
  query: string;
  visitorId: string;
}

interface CustomerMemoryRecallDependencies {
  findMatches?: CustomerMemoryEmbeddingPersistence["findMatches"];
  generateEmbedding?: (value: string, env: DemoEnv) => Promise<number[]>;
  generateEmbeddings?: (values: string[], env: DemoEnv) => Promise<number[][]>;
  loadDatabase?: () => Promise<CustomerMemoryRecallDatabaseModule>;
  recordSearchHits?: (memories: RetrievedCustomerMemory[]) => Promise<void>;
}

interface CustomerMemoryRecallDatabaseModule {
  customerMemoryEmbeddings: typeof import("@workspace/database")["customerMemoryEmbeddings"];
  customerMemoryMemories: typeof import("@workspace/database")["customerMemoryMemories"];
  database: typeof import("@workspace/database")["database"];
}

function buildEmbeddingContent(memory: CustomerMemoryRecord) {
  return [memory.category, memory.title, memory.content]
    .filter(Boolean)
    .join("\n");
}

async function loadCustomerMemoryAgentDatabase(): Promise<CustomerMemoryRecallDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    customerMemoryEmbeddings: databaseModule.customerMemoryEmbeddings,
    customerMemoryMemories: databaseModule.customerMemoryMemories,
    database: databaseModule.database,
  };
}

async function replaceCustomerMemoryEmbeddings(
  records: CustomerMemoryEmbeddingRecord[],
  loadDatabase: () => Promise<CustomerMemoryRecallDatabaseModule>
) {
  const { customerMemoryEmbeddings, database } = await loadDatabase();

  if (records.length === 0) {
    return;
  }

  await database.transaction(async (transaction) => {
    await transaction.delete(customerMemoryEmbeddings).where(
      inArray(
        customerMemoryEmbeddings.memoryId,
        records.map((record) => record.memoryId)
      )
    );

    await transaction.insert(customerMemoryEmbeddings).values(records);
  });
}

async function findCustomerMemoryMatches(
  input: {
    customerId: string;
    queryEmbedding: number[];
    visitorId: string;
  },
  loadDatabase: () => Promise<CustomerMemoryRecallDatabaseModule>
): Promise<RetrievedCustomerMemory[]> {
  const { customerMemoryEmbeddings, customerMemoryMemories, database } =
    await loadDatabase();
  const similarity = sql<number>`1 - (${cosineDistance(
    customerMemoryEmbeddings.embedding,
    input.queryEmbedding
  )})`;
  const boostedSimilarity = sql<number>`${similarity} + least(${customerMemoryMemories.accessCount} * 0.01, 0.05)`;

  return database
    .select({
      accessCount: customerMemoryMemories.accessCount,
      category: customerMemoryMemories.category,
      content: customerMemoryMemories.content,
      createdAt: customerMemoryMemories.createdAt,
      customerId: customerMemoryMemories.customerId,
      id: customerMemoryMemories.id,
      lastAccessedAt: customerMemoryMemories.lastAccessedAt,
      metadata: customerMemoryMemories.metadata,
      similarity: boostedSimilarity,
      sourceMessageId: customerMemoryMemories.sourceMessageId,
      status: customerMemoryMemories.status,
      threadId: customerMemoryMemories.threadId,
      title: customerMemoryMemories.title,
      updatedAt: customerMemoryMemories.updatedAt,
      visitorId: customerMemoryMemories.visitorId,
    })
    .from(customerMemoryEmbeddings)
    .innerJoin(
      customerMemoryMemories,
      eq(customerMemoryEmbeddings.memoryId, customerMemoryMemories.id)
    )
    .where(
      and(
        eq(customerMemoryMemories.customerId, input.customerId),
        eq(customerMemoryMemories.visitorId, input.visitorId),
        ne(customerMemoryMemories.status, "deleted"),
        gt(similarity, minimumSimilarity)
      )
    )
    .orderBy((table) => desc(table.similarity))
    .limit(memoryRecallLimit)
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : row.createdAt,
        lastAccessedAt:
          row.lastAccessedAt instanceof Date
            ? row.lastAccessedAt.toISOString()
            : row.lastAccessedAt,
        metadata: (row.metadata as Record<string, unknown> | null) ?? null,
        status: row.status as CustomerMemoryRecord["status"],
        updatedAt:
          row.updatedAt instanceof Date
            ? row.updatedAt.toISOString()
            : row.updatedAt,
      }))
    );
}

export async function generateCustomerMemoryEmbedding(
  value: string,
  env: DemoEnv = appEnv
): Promise<number[]> {
  const gateway = createAiGateway(env);
  const normalizedValue = value.replaceAll("\n", " ").trim();
  const { embedding } = await embed({
    model: gateway.embeddingModel(embeddingModelId),
    value: normalizedValue,
  });

  return embedding;
}

export async function generateCustomerMemoryEmbeddings(
  values: string[],
  env: DemoEnv = appEnv
): Promise<number[][]> {
  const gateway = createAiGateway(env);
  const { embeddings } = await embedMany({
    model: gateway.embeddingModel(embeddingModelId),
    values: values.map((value) => value.replaceAll("\n", " ").trim()),
  });

  return embeddings;
}

export async function indexCustomerMemories(
  memories: CustomerMemoryRecord[],
  persistence: Pick<CustomerMemoryEmbeddingPersistence, "replaceEmbeddings">,
  dependencies: Pick<
    CustomerMemoryRecallDependencies,
    "generateEmbeddings"
  > = {}
) {
  if (memories.length === 0) {
    return;
  }

  const generateEmbeddings =
    dependencies.generateEmbeddings ?? generateCustomerMemoryEmbeddings;
  const contents = memories.map(buildEmbeddingContent);
  const embeddings = await generateEmbeddings(contents, appEnv);

  await persistence.replaceEmbeddings(
    memories.map((memory, index) => {
      const embedding = embeddings[index];

      if (!embedding) {
        throw new Error(
          `Missing customer-memory embedding ${index} for ${memory.id}.`
        );
      }

      return {
        content: contents[index] ?? memory.content,
        embedding,
        memoryId: memory.id,
      };
    })
  );
}

export const indexCustomerMemoryEntries = indexCustomerMemories;

export async function findRelevantCustomerMemory(
  input: FindRelevantCustomerMemoryInput,
  env: DemoEnv = appEnv,
  dependencies: CustomerMemoryRecallDependencies = {}
) {
  const normalizedQuery = input.query.trim();

  if (normalizedQuery.length === 0) {
    return [];
  }

  const generateEmbedding =
    dependencies.generateEmbedding ?? generateCustomerMemoryEmbedding;
  const findMatches =
    dependencies.findMatches ??
    ((nextInput: {
      customerId: string;
      queryEmbedding: number[];
      visitorId: string;
    }) =>
      findCustomerMemoryMatches(
        nextInput,
        dependencies.loadDatabase ?? loadCustomerMemoryAgentDatabase
      ));
  const queryEmbedding = await generateEmbedding(normalizedQuery, env);
  const matches = await findMatches({
    customerId: input.customerId,
    queryEmbedding,
    visitorId: input.visitorId,
  });

  await (
    dependencies.recordSearchHits ??
    (async (memories: RetrievedCustomerMemory[]) => {
      const store = createCustomerMemoryStore();
      await store.markMemoriesAccessed(memories.map((memory) => memory.id));
      await Promise.all(
        memories.map((memory) =>
          store.recordEvent({
            afterContent: memory.content,
            beforeContent: null,
            customerId: memory.customerId,
            memoryId: memory.id,
            metadata: memory.metadata,
            operation: "search_hit",
            reason: `Retrieved for query: ${normalizedQuery}`,
            sourceMessageId: memory.sourceMessageId,
            threadId: memory.threadId,
            visitorId: memory.visitorId,
          })
        )
      );
    })
  )(matches);

  return matches;
}

export function createCustomerMemoryEmbeddingPersistence(
  loadDatabase: () => Promise<CustomerMemoryRecallDatabaseModule> = loadCustomerMemoryAgentDatabase
): CustomerMemoryEmbeddingPersistence {
  return {
    findMatches: (input) => findCustomerMemoryMatches(input, loadDatabase),
    replaceEmbeddings: (records) =>
      replaceCustomerMemoryEmbeddings(records, loadDatabase),
  };
}
