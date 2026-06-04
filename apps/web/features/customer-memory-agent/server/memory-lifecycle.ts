import {
  createCustomerMemoryEmbeddingPersistence,
  indexCustomerMemories,
} from "./memory-recall";
import {
  type CustomerMemoryRecord,
  createCustomerMemoryStore,
} from "./memory-store";

type CustomerMemoryCategory = CustomerMemoryRecord["category"];

export interface CustomerMemoryLifecycleOperation {
  category: CustomerMemoryCategory;
  content: string;
  memoryId: string | null;
  operation: "add" | "update" | "delete" | "noop";
  reason: string;
  sourceMessageId: string | null;
  title: string;
}

interface CustomerMemoryLifecycleContext {
  customerId: string;
  threadId: string | null;
  visitorId: string;
}

interface CustomerMemorySeedEntry {
  category: CustomerMemoryCategory;
  content: string;
  sourceMessageId: string | null;
  title: string;
}

interface CustomerMemoryLifecycleDependencies {
  createEmbeddingPersistence?: typeof createCustomerMemoryEmbeddingPersistence;
  indexMemories?: typeof indexCustomerMemories;
  store?: Pick<
    ReturnType<typeof createCustomerMemoryStore>,
    "addMemory" | "deleteMemory" | "recordEvent" | "updateMemory"
  >;
}

function dedupeMemoryOperations(
  operations: CustomerMemoryLifecycleOperation[]
) {
  const uniqueOperations = new Map<string, CustomerMemoryLifecycleOperation>();

  for (const operation of operations) {
    const key = `${operation.operation}::${operation.memoryId ?? ""}::${operation.category}::${operation.title}::${operation.content}`;

    if (!uniqueOperations.has(key)) {
      uniqueOperations.set(key, operation);
    }
  }

  return [...uniqueOperations.values()];
}

async function indexSavedMemories(
  memories: CustomerMemoryRecord[],
  dependencies: CustomerMemoryLifecycleDependencies
) {
  if (memories.length === 0) {
    return;
  }

  const persistence = (
    dependencies.createEmbeddingPersistence ??
    createCustomerMemoryEmbeddingPersistence
  )();

  await (dependencies.indexMemories ?? indexCustomerMemories)(
    memories,
    persistence
  );
}

export function createCustomerMemoryLifecycle(
  dependencies: CustomerMemoryLifecycleDependencies = {}
) {
  const store = dependencies.store ?? createCustomerMemoryStore();

  return {
    async applyOperations(
      operations: CustomerMemoryLifecycleOperation[],
      context: CustomerMemoryLifecycleContext
    ) {
      const uniqueOperations = dedupeMemoryOperations(operations);
      const memoriesToIndex: CustomerMemoryRecord[] = [];

      for (const operation of uniqueOperations) {
        if (operation.operation === "noop") {
          await store.recordEvent({
            afterContent: null,
            beforeContent: null,
            customerId: context.customerId,
            memoryId: null,
            operation: "noop",
            reason: operation.reason,
            sourceMessageId: operation.sourceMessageId,
            threadId: context.threadId,
            visitorId: context.visitorId,
          });
          continue;
        }

        if (operation.operation === "delete") {
          if (!operation.memoryId) {
            throw new Error("Customer-memory delete requires a memoryId.");
          }

          await store.deleteMemory({
            customerId: context.customerId,
            memoryId: operation.memoryId,
            reason: operation.reason,
            sourceMessageId: operation.sourceMessageId,
            visitorId: context.visitorId,
          });
          continue;
        }

        if (operation.operation === "update") {
          if (!operation.memoryId) {
            throw new Error("Customer-memory update requires a memoryId.");
          }

          memoriesToIndex.push(
            await store.updateMemory({
              category: operation.category,
              content: operation.content,
              customerId: context.customerId,
              memoryId: operation.memoryId,
              reason: operation.reason,
              sourceMessageId: operation.sourceMessageId,
              title: operation.title,
              visitorId: context.visitorId,
            })
          );
          continue;
        }

        memoriesToIndex.push(
          await store.addMemory({
            category: operation.category,
            content: operation.content,
            customerId: context.customerId,
            reason: operation.reason,
            sourceMessageId: operation.sourceMessageId,
            threadId: context.threadId,
            title: operation.title,
            visitorId: context.visitorId,
          })
        );
      }

      await indexSavedMemories(memoriesToIndex, dependencies);

      return memoriesToIndex;
    },

    async seedMemories(
      memories: CustomerMemorySeedEntry[],
      context: CustomerMemoryLifecycleContext,
      reason = "Seeded shared customer-memory demo snapshot."
    ) {
      const savedMemories: CustomerMemoryRecord[] = [];

      for (const memory of memories) {
        savedMemories.push(
          await store.addMemory({
            category: memory.category,
            content: memory.content,
            customerId: context.customerId,
            reason,
            sourceMessageId: memory.sourceMessageId,
            threadId: context.threadId,
            title: memory.title,
            visitorId: context.visitorId,
          })
        );
      }

      await indexSavedMemories(savedMemories, dependencies);

      return savedMemories;
    },
  };
}
