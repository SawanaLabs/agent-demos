import { validateUIMessages, type UIMessage } from "ai";
import { count, eq } from "drizzle-orm";

import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";

import { streamRagChatbot } from "./chat";
import { ragChatbotSourceDocument } from "./source-document";

type DemoEnv = Record<string, string | undefined>;

interface RagChatbotRequestBody {
  messages?: UIMessage[];
}

export interface RagChatbotRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  sourceDocument: typeof ragChatbotSourceDocument;
  setupMessage: string | null;
  statusLabel: "Index required" | "Ready" | "Setup required";
}

interface RagDatabaseModule {
  database: (typeof import("@workspace/database"))["database"];
  ragChatbotResources: (typeof import("@workspace/database"))["ragChatbotResources"];
}

export interface RagChatbotRuntimeDependencies {
  getIndexedResourceCount: (env: DemoEnv) => Promise<number>;
}

interface RagChatbotRequestDependencies extends RagChatbotRuntimeDependencies {
  streamRagChatbot: (messages: UIMessage[], env: DemoEnv) => Promise<Response>;
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

function getDatabaseSetupIssue(env: DemoEnv): string | null {
  if (env.DATABASE_URL) {
    return null;
  }

  return "DATABASE_URL is missing. The RAG chatbot can render, but chat requests require a preindexed pgvector database.";
}

async function loadRagDatabase(): Promise<RagDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    database: databaseModule.database,
    ragChatbotResources: databaseModule.ragChatbotResources,
  };
}

async function getIndexedResourceCount(env: DemoEnv): Promise<number> {
  if (!env.DATABASE_URL) {
    return 0;
  }

  const { database, ragChatbotResources } = await loadRagDatabase();
  const rows = await database
    .select({ resourceCount: count() })
    .from(ragChatbotResources)
    .where(eq(ragChatbotResources.sourceSlug, ragChatbotSourceDocument.slug));

  return rows[0]?.resourceCount ?? 0;
}

export async function getRagChatbotRuntimeState(
  env: DemoEnv = process.env,
  dependencies: RagChatbotRuntimeDependencies = {
    getIndexedResourceCount,
  }
): Promise<RagChatbotRuntimeState> {
  const gatewaySetup = getAiGatewaySetupState(env);
  const issues = [...gatewaySetup.issues];
  const databaseIssue = getDatabaseSetupIssue(env);

  if (databaseIssue) {
    issues.push(databaseIssue);
  }

  if (issues.length === 0) {
    try {
      const indexedResourceCount =
        await dependencies.getIndexedResourceCount(env);

      if (indexedResourceCount === 0) {
        return {
          chatModel: gatewaySetup.config.chatModel,
          isChatAvailable: false,
          nodeVersion: gatewaySetup.nodeVersion,
          setupMessage: `No preindexed documents are available for the RAG chatbot. Run POST /api/demos/rag-chatbot/index to index ${ragChatbotSourceDocument.title}.`,
          sourceDocument: ragChatbotSourceDocument,
          statusLabel: "Index required",
        };
      }
    } catch (error) {
      issues.push(
        error instanceof Error
          ? `Failed to inspect the indexed document state. ${error.message}`
          : "Failed to inspect the indexed document state."
      );
    }
  }

  return {
    chatModel: gatewaySetup.config.chatModel,
    isChatAvailable: issues.length === 0,
    nodeVersion: gatewaySetup.nodeVersion,
    sourceDocument: ragChatbotSourceDocument,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
  };
}

async function readRagChatbotMessages(body: unknown): Promise<UIMessage[]> {
  const { messages } = (body ?? {}) as RagChatbotRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export async function handleRagChatbotRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: RagChatbotRequestDependencies = {
    getIndexedResourceCount,
    streamRagChatbot,
  }
) {
  const runtimeState = await getRagChatbotRuntimeState(env, dependencies);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let messages: UIMessage[];

  try {
    messages = await readRagChatbotMessages(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        {
          error: malformedJsonError,
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      [invalidMessagesError, invalidUiMessagesError].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }

  return dependencies.streamRagChatbot(messages, env);
}
