import { count, eq } from "drizzle-orm";

import {
  type RagChatbotDatabaseModule,
  loadRagChatbotDatabase,
} from "./database";
import { getPortableRagIndexResourceCount } from "./portable-index";
import { ragChatbotSourceDocument } from "./source-document";

type DemoEnv = Record<string, string | undefined>;
type RagRetrievalLabel = "Portable index" | "pgvector";

export interface RagKnowledgeBaseStatus {
  indexedResourceCount: number;
  isReady: boolean;
  message: string | null;
  retrievalLabel: RagRetrievalLabel;
  statusLabel: "Index required" | "Ready" | "Setup required";
}

export interface RagKnowledgeBaseStatusDependencies {
  getIndexedResourceCount?: (env: DemoEnv) => Promise<number>;
  loadDatabase?: () => Promise<RagChatbotDatabaseModule>;
}

export function getRagDatabaseSetupIssue(env: DemoEnv): string | null {
  if (env.DATABASE_URL) {
    return null;
  }

  return null;
}

export function getRagIndexRequiredMessage() {
  return `No preindexed documents are available for the RAG chatbot. Run POST /api/demos/rag-chatbot/index to index ${ragChatbotSourceDocument.title}.`;
}

export async function getIndexedResourceCount(
  env: DemoEnv,
  dependencies: RagKnowledgeBaseStatusDependencies = {}
): Promise<number> {
  if (!env.DATABASE_URL) {
    return 0;
  }

  const loadDatabase = dependencies.loadDatabase ?? loadRagChatbotDatabase;
  const { database, ragChatbotResources } = await loadDatabase();
  const rows = await database
    .select({ resourceCount: count() })
    .from(ragChatbotResources)
    .where(eq(ragChatbotResources.sourceSlug, ragChatbotSourceDocument.slug));

  return rows[0]?.resourceCount ?? 0;
}

export async function getRagKnowledgeBaseStatus(
  env: DemoEnv,
  dependencies: RagKnowledgeBaseStatusDependencies = {}
): Promise<RagKnowledgeBaseStatus> {
  const databaseIssue = getRagDatabaseSetupIssue(env);

  if (databaseIssue) {
    return {
      indexedResourceCount: 0,
      isReady: false,
      message: databaseIssue,
      retrievalLabel: "pgvector",
      statusLabel: "Setup required",
    };
  }

  if (!env.DATABASE_URL) {
    return {
      indexedResourceCount: getPortableRagIndexResourceCount(),
      isReady: true,
      message: null,
      retrievalLabel: "Portable index",
      statusLabel: "Ready",
    };
  }

  try {
    const indexedResourceCount = dependencies.getIndexedResourceCount
      ? await dependencies.getIndexedResourceCount(env)
      : await getIndexedResourceCount(env, dependencies);

    if (indexedResourceCount === 0) {
      return {
        indexedResourceCount,
        isReady: false,
        message: getRagIndexRequiredMessage(),
        retrievalLabel: "pgvector",
        statusLabel: "Index required",
      };
    }

    return {
      indexedResourceCount,
      isReady: true,
      message: null,
      retrievalLabel: "pgvector",
      statusLabel: "Ready",
    };
  } catch (error) {
    return {
      indexedResourceCount: 0,
      isReady: false,
      message:
        error instanceof Error
          ? `Failed to inspect the indexed document state. ${error.message}`
          : "Failed to inspect the indexed document state.",
      retrievalLabel: "pgvector",
      statusLabel: "Setup required",
    };
  }
}

export async function ensureRagKnowledgeBaseReady(
  env: DemoEnv,
  dependencies: RagKnowledgeBaseStatusDependencies = {}
) {
  const status = await getRagKnowledgeBaseStatus(env, dependencies);

  if (!status.isReady) {
    throw new Error(status.message ?? "The RAG knowledge base is unavailable.");
  }
}
