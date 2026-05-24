import { createHash } from "node:crypto";
import { count, eq } from "@workspace/database/drizzle";
import { embedMany } from "ai";
import { env as appEnv } from "@/env";

import { createAiGateway } from "@/features/shared/ai-gateway/server/env";

import {
  buildRagPdfChunks,
  downloadPdfDocument,
  type ExtractedPdfPage,
  extractPdfPages,
} from "./ingestion";
import { ragChatbotSourceDocument } from "./source-document";

type DemoEnv = Record<string, string | undefined>;

const embeddingModelId = "openai/text-embedding-3-small";

interface RagDatabaseModule {
  database: typeof import("@workspace/database")["database"];
  ragChatbotEmbeddings: typeof import("@workspace/database")["ragChatbotEmbeddings"];
  ragChatbotResources: typeof import("@workspace/database")["ragChatbotResources"];
}

interface IndexRagChatbotSourceDependencies {
  downloadDocument: (documentUrl: string) => Promise<Uint8Array>;
  extractPages: (pdfBytes: Uint8Array) => Promise<ExtractedPdfPage[]>;
  loadDatabase: () => Promise<RagDatabaseModule>;
}

export interface RagSourceIndexResult {
  chunkCount: number;
  sourceSlug: string;
  status: "already-indexed" | "indexed";
}

async function loadRagDatabase(): Promise<RagDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    database: databaseModule.database,
    ragChatbotEmbeddings: databaseModule.ragChatbotEmbeddings,
    ragChatbotResources: databaseModule.ragChatbotResources,
  };
}

function buildDocumentHash(pdfBytes: Uint8Array) {
  return createHash("sha256").update(pdfBytes).digest("hex");
}

function buildEmbeddingRows(
  chunks: ReturnType<typeof buildRagPdfChunks>,
  embeddings: Awaited<ReturnType<typeof embedMany>>["embeddings"],
  resourceId: string
) {
  return chunks.map((chunk, index) => {
    const embedding = embeddings[index];

    if (!embedding) {
      throw new Error(
        `Missing embedding ${index} while indexing ${ragChatbotSourceDocument.slug}.`
      );
    }

    return {
      chunkIndex: index,
      content: chunk.content,
      embedding,
      pageLabel: chunk.pageLabel,
      resourceId,
      sectionTitle: chunk.sectionTitle,
    };
  });
}

export async function indexRagChatbotSource(
  env: DemoEnv = appEnv,
  dependencies: IndexRagChatbotSourceDependencies = {
    downloadDocument: downloadPdfDocument,
    extractPages: extractPdfPages,
    loadDatabase: loadRagDatabase,
  }
): Promise<RagSourceIndexResult> {
  const pdfBytes = await dependencies.downloadDocument(
    ragChatbotSourceDocument.documentUrl
  );
  const contentHash = buildDocumentHash(pdfBytes);
  const { database, ragChatbotEmbeddings, ragChatbotResources } =
    await dependencies.loadDatabase();
  const existingResources = await database
    .select({
      contentHash: ragChatbotResources.contentHash,
      id: ragChatbotResources.id,
    })
    .from(ragChatbotResources)
    .where(eq(ragChatbotResources.sourceSlug, ragChatbotSourceDocument.slug))
    .limit(1);
  const existingResource = existingResources[0];

  if (existingResource?.contentHash === contentHash) {
    const chunkCountRows = await database
      .select({ chunkCount: count() })
      .from(ragChatbotEmbeddings)
      .where(eq(ragChatbotEmbeddings.resourceId, existingResource.id));

    return {
      chunkCount: chunkCountRows[0]?.chunkCount ?? 0,
      sourceSlug: ragChatbotSourceDocument.slug,
      status: "already-indexed",
    };
  }

  const pages = await dependencies.extractPages(pdfBytes);
  const chunks = buildRagPdfChunks(pages);

  if (chunks.length === 0) {
    throw new Error(
      `The RAG source PDF at ${ragChatbotSourceDocument.documentUrl} did not produce any indexable text.`
    );
  }

  const gateway = createAiGateway(env);
  const { embeddings } = await embedMany({
    model: gateway.embeddingModel(embeddingModelId),
    values: chunks.map((chunk) => chunk.content),
  });
  const resourceValues = {
    contentHash,
    description: ragChatbotSourceDocument.description,
    documentUrl: ragChatbotSourceDocument.documentUrl,
    sourcePageUrl: ragChatbotSourceDocument.sourcePageUrl,
    sourceSlug: ragChatbotSourceDocument.slug,
    title: ragChatbotSourceDocument.title,
    updatedAt: new Date(),
  };

  if (existingResource) {
    await database.transaction(async (transaction) => {
      await transaction
        .update(ragChatbotResources)
        .set(resourceValues)
        .where(eq(ragChatbotResources.id, existingResource.id));
      await transaction
        .delete(ragChatbotEmbeddings)
        .where(eq(ragChatbotEmbeddings.resourceId, existingResource.id));
      await transaction
        .insert(ragChatbotEmbeddings)
        .values(buildEmbeddingRows(chunks, embeddings, existingResource.id));
    });
  } else {
    await database.transaction(async (transaction) => {
      const [resource] = await transaction
        .insert(ragChatbotResources)
        .values(resourceValues)
        .returning({ id: ragChatbotResources.id });

      if (!resource) {
        throw new Error(
          "Failed to create the source resource row for the RAG chatbot."
        );
      }

      await transaction
        .insert(ragChatbotEmbeddings)
        .values(buildEmbeddingRows(chunks, embeddings, resource.id));
    });
  }

  return {
    chunkCount: chunks.length,
    sourceSlug: ragChatbotSourceDocument.slug,
    status: "indexed",
  };
}
