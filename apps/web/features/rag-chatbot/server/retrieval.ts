import { embed } from "ai";
import {
  and,
  cosineDistance,
  desc,
  eq,
  gt,
  sql,
} from "@workspace/database/drizzle";

import { createAiGateway } from "@/features/shared/ai-gateway/server/env";

import {
  ensureRagKnowledgeBaseReady,
  loadRagChatbotDatabase,
  type RagDatabaseModule,
} from "./knowledge-base-status";
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

interface RagRetrievalDatabaseModule extends RagDatabaseModule {
  ragChatbotEmbeddings: (typeof import("@workspace/database"))["ragChatbotEmbeddings"];
}

interface FindRelevantContentDependencies {
  ensureKnowledgeBaseReady?: (env: DemoEnv) => Promise<void>;
  generateEmbedding: (value: string, env: DemoEnv) => Promise<number[]>;
  findMatches?: (input: {
    queryEmbedding: number[];
    sourceSlug: string;
  }) => Promise<RetrievedRagContent[]>;
  loadDatabase?: () => Promise<RagRetrievalDatabaseModule>;
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

async function loadRagDatabase(): Promise<RagRetrievalDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    database: databaseModule.database,
    ragChatbotEmbeddings: databaseModule.ragChatbotEmbeddings,
    ragChatbotResources: databaseModule.ragChatbotResources,
  };
}

async function findMatchesForSource(
  input: {
    queryEmbedding: number[];
    sourceSlug: string;
  },
  loadDatabase: () => Promise<RagRetrievalDatabaseModule>
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
  const ensureKnowledgeBaseReady =
    dependencies.ensureKnowledgeBaseReady ??
    ((nextEnv: DemoEnv) =>
      ensureRagKnowledgeBaseReady(nextEnv, {
        loadDatabase: loadDatabase as never,
      }));
  const findMatches =
    dependencies.findMatches ??
    ((input: { queryEmbedding: number[]; sourceSlug: string }) =>
      findMatchesForSource(input, loadDatabase));

  await ensureKnowledgeBaseReady(env);

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
