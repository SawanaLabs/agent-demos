import {
  and,
  cosineDistance,
  desc,
  eq,
  gt,
  sql,
} from "drizzle-orm";

import { embed } from "ai";

import {
  type RagChatbotDatabaseModule,
  loadRagChatbotDatabase,
} from "./database";
import {
  createRagChatbotGateway,
  getRagChatbotConfig,
  getRagChatbotEnv,
  type RagChatbotEnv,
} from "./env";
import {
  ensureRagKnowledgeBaseReady,
} from "./knowledge-base-status";
import { findPortableRagMatches } from "./portable-index";
import { ragChatbotSourceDocument } from "./source-document";

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

interface FindRelevantContentDependencies {
  ensureKnowledgeBaseReady?: (env: RagChatbotEnv) => Promise<void>;
  findMatches?: (input: {
    queryEmbedding: number[];
    sourceSlug: string;
  }) => Promise<RetrievedRagContent[]>;
  generateEmbedding: (value: string, env: RagChatbotEnv) => Promise<number[]>;
  loadDatabase?: () => Promise<RagChatbotDatabaseModule>;
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

async function findMatchesForSource(
  input: {
    queryEmbedding: number[];
    sourceSlug: string;
  },
  loadDatabase: () => Promise<RagChatbotDatabaseModule>
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
  env: RagChatbotEnv = getRagChatbotEnv()
): Promise<number[]> {
  const gateway = createRagChatbotGateway(env);
  const normalizedValue = value.replaceAll("\n", " ").trim();
  const { embeddingModel } = getRagChatbotConfig(env);
  const { embedding } = await embed({
    model: gateway.embeddingModel(embeddingModel),
    value: normalizedValue,
  });

  return embedding;
}

export async function findRelevantContent(
  userQuery: string,
  env: RagChatbotEnv = getRagChatbotEnv(),
  dependencies: FindRelevantContentDependencies = {
    generateEmbedding: generateRagEmbedding,
  }
): Promise<RagToolResult> {
  const normalizedQuery = userQuery.trim();

  if (normalizedQuery.length === 0) {
    return createRagToolResult([]);
  }

  const sourceSlug = ragChatbotSourceDocument.slug;

  if (!env.DATABASE_URL) {
    return createRagToolResult(findPortableRagMatches(normalizedQuery));
  }

  const loadDatabase = dependencies.loadDatabase ?? loadRagChatbotDatabase;
  const ensureKnowledgeBaseReady =
    dependencies.ensureKnowledgeBaseReady ??
    ((nextEnv: RagChatbotEnv) =>
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
