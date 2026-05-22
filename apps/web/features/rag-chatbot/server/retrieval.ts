import { embed } from "ai";
import {
  and,
  count,
  cosineDistance,
  desc,
  eq,
  gt,
  sql,
} from "drizzle-orm";

import { createAiGateway } from "@/features/shared/ai-gateway/server/env";

import { ragChatbotSourceDocument } from "./source-document";

type DemoEnv = Record<string, string | undefined>;

const embeddingModelId = "openai/text-embedding-3-small";
const matchLimit = 4;
const minimumSimilarity = 0.55;

export interface RetrievedRagContent {
  content: string;
  documentUrl: string;
  pageLabel: string | null;
  sectionTitle: string | null;
  similarity: number;
  title: string;
}

export interface RagToolSource {
  citationLabel: string;
  content: string;
  documentUrl: string;
  pageLabel: string | null;
  sectionTitle: string | null;
  similarity: number;
  title: string;
}

export interface RagToolResult {
  answerable: boolean;
  message: string;
  sources: RagToolSource[];
}

interface RagDatabaseModule {
  database: (typeof import("@workspace/database"))["database"];
  ragChatbotEmbeddings: (typeof import("@workspace/database"))["ragChatbotEmbeddings"];
  ragChatbotResources: (typeof import("@workspace/database"))["ragChatbotResources"];
}

interface FindRelevantContentDependencies {
  generateEmbedding: (value: string, env: DemoEnv) => Promise<number[]>;
  countIndexedResources?: (sourceSlug: string) => Promise<number>;
  findMatches?: (input: {
    queryEmbedding: number[];
    sourceSlug: string;
  }) => Promise<RetrievedRagContent[]>;
  loadDatabase?: () => Promise<RagDatabaseModule>;
}

function createCitationLabel(source: RetrievedRagContent): string {
  return source.pageLabel
    ? `${source.title}, p. ${source.pageLabel}`
    : source.title;
}

export function createRagToolResult(
  matches: RetrievedRagContent[]
): RagToolResult {
  if (matches.length === 0) {
    return {
      answerable: false,
      message:
        "No relevant indexed document snippets were found for this question.",
      sources: [],
    };
  }

  return {
    answerable: true,
    message: `Found ${matches.length} relevant indexed document ${
      matches.length === 1 ? "snippet" : "snippets"
    }.`,
    sources: matches.map((match) => ({
      citationLabel: createCitationLabel(match),
      content: match.content,
      documentUrl: match.documentUrl,
      pageLabel: match.pageLabel,
      sectionTitle: match.sectionTitle,
      similarity: match.similarity,
      title: match.title,
    })),
  };
}

async function loadRagDatabase(): Promise<RagDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    database: databaseModule.database,
    ragChatbotEmbeddings: databaseModule.ragChatbotEmbeddings,
    ragChatbotResources: databaseModule.ragChatbotResources,
  };
}

async function countIndexedResourcesForSource(
  sourceSlug: string,
  loadDatabase: () => Promise<RagDatabaseModule>
): Promise<number> {
  const { database, ragChatbotResources } = await loadDatabase();
  const resourceCountRows = await database
    .select({ resourceCount: count() })
    .from(ragChatbotResources)
    .where(eq(ragChatbotResources.sourceSlug, sourceSlug));

  return resourceCountRows[0]?.resourceCount ?? 0;
}

async function findMatchesForSource(
  input: {
    queryEmbedding: number[];
    sourceSlug: string;
  },
  loadDatabase: () => Promise<RagDatabaseModule>
): Promise<RetrievedRagContent[]> {
  const { database, ragChatbotEmbeddings, ragChatbotResources } =
    await loadDatabase();
  const similarity = sql<number>`1 - (${cosineDistance(
    ragChatbotEmbeddings.embedding,
    input.queryEmbedding
  )})`;

  return database
    .select({
      content: ragChatbotEmbeddings.content,
      documentUrl: ragChatbotResources.documentUrl,
      pageLabel: ragChatbotEmbeddings.pageLabel,
      sectionTitle: ragChatbotEmbeddings.sectionTitle,
      similarity,
      title: ragChatbotResources.title,
    })
    .from(ragChatbotEmbeddings)
    .innerJoin(
      ragChatbotResources,
      eq(ragChatbotEmbeddings.resourceId, ragChatbotResources.id)
    )
    .where(
      and(
        eq(ragChatbotResources.sourceSlug, input.sourceSlug),
        gt(similarity, minimumSimilarity)
      )
    )
    .orderBy((table) => desc(table.similarity))
    .limit(matchLimit);
}

export async function generateRagEmbedding(
  value: string,
  env: DemoEnv = process.env
): Promise<number[]> {
  const gateway = createAiGateway(env);
  const normalizedValue = value.replaceAll("\n", " ").trim();
  const { embedding } = await embed({
    model: gateway.embeddingModel(embeddingModelId),
    value: normalizedValue,
  });

  return embedding;
}

export async function findRelevantContent(
  userQuery: string,
  env: DemoEnv = process.env,
  dependencies: FindRelevantContentDependencies = {
    generateEmbedding: generateRagEmbedding,
  }
): Promise<RagToolResult> {
  const normalizedQuery = userQuery.trim();

  if (normalizedQuery.length === 0) {
    return createRagToolResult([]);
  }

  const sourceSlug = ragChatbotSourceDocument.slug;
  const loadDatabase = dependencies.loadDatabase ?? loadRagDatabase;
  const countIndexedResources =
    dependencies.countIndexedResources ??
    ((slug: string) => countIndexedResourcesForSource(slug, loadDatabase));
  const findMatches =
    dependencies.findMatches ??
    ((input: { queryEmbedding: number[]; sourceSlug: string }) =>
      findMatchesForSource(input, loadDatabase));
  const resourceCount = await countIndexedResources(sourceSlug);

  if (resourceCount === 0) {
    throw new Error(
      `No preindexed documents are available for the RAG chatbot. Index ${ragChatbotSourceDocument.title} before sending chat requests.`
    );
  }

  const queryEmbedding = await dependencies.generateEmbedding(
    normalizedQuery,
    env
  );
  const matches = await findMatches({
    queryEmbedding,
    sourceSlug,
  });

  return createRagToolResult(matches);
}
