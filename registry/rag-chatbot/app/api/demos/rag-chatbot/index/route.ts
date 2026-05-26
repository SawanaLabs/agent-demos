import {
  getRagChatbotEnv,
  getRagChatbotIndexSetupIssue,
} from "@/lib/rag-chatbot/env";
import { indexRagChatbotSource } from "@/lib/rag-chatbot/index-source";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(_request: Request) {
  const env = getRagChatbotEnv();

  if (env.NODE_ENV === "production") {
    return Response.json(
      {
        error:
          "Source indexing is disabled in production. Run ingestion through a trusted setup job.",
      },
      { status: 403 }
    );
  }

  const setupIssue = getRagChatbotIndexSetupIssue(env);

  if (setupIssue) {
    return Response.json(
      {
        error: setupIssue,
      },
      { status: 500 }
    );
  }

  try {
    const result = await indexRagChatbotSource(env);

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
