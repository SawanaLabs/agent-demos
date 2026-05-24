import { env as appEnv } from "@/env";

import { indexRagChatbotSource } from "@/features/rag-chatbot/server/index-source";

export const runtime = "nodejs";
export const maxDuration = 30;

function getIndexSetupIssue(env: {
  AI_GATEWAY_API_KEY?: string;
  DATABASE_URL?: string;
}): string | null {
  if (!env.AI_GATEWAY_API_KEY) {
    return "AI_GATEWAY_API_KEY is missing. Source indexing requires embedding generation through AI Gateway.";
  }

  if (!env.DATABASE_URL) {
    return "DATABASE_URL is missing. Source indexing requires a writable pgvector database.";
  }

  return null;
}

export async function POST(_request: Request) {
  if (appEnv.NODE_ENV === "production") {
    return Response.json(
      {
        error:
          "Source indexing is disabled in production. Run ingestion through a trusted setup job.",
      },
      { status: 403 }
    );
  }

  const setupIssue = getIndexSetupIssue(appEnv);

  if (setupIssue) {
    return Response.json(
      {
        error: setupIssue,
      },
      { status: 500 }
    );
  }

  try {
    const result = await indexRagChatbotSource();

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to index the RAG source document.",
      },
      { status: 500 }
    );
  }
}
