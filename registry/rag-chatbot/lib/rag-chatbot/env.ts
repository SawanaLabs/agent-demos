import { getRagChatbotAppEnv } from "./env-source";
import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";

const DEFAULT_RAG_CHATBOT_CHAT_MODEL = "openai/gpt-4.1-mini";
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";

export type RagChatbotEnv = AiGatewayEnvRecord;

export interface RagChatbotConfig extends AiGatewayContractConfig {
  databaseUrl: string | undefined;
  embeddingModel: string;
}

export interface RagChatbotSetupConfig extends AiGatewaySetupConfig {
  embeddingModel: string;
}

export type RagChatbotSetupState = AiGatewayContractSetupState<RagChatbotSetupConfig>;

export type RagChatbotGateway = ReturnType<typeof createAiGatewayFromContract>;

const ragChatbotContract = {
  defaultChatModel: DEFAULT_RAG_CHATBOT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the RAG chatbot.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getRagChatbotEnv(): RagChatbotEnv {
  return getRagChatbotAppEnv();
}

function resolveRagChatbotEmbeddingModel(env: RagChatbotEnv) {
  return env.AI_GATEWAY_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
}

export function getRagChatbotConfig(
  env: RagChatbotEnv = getRagChatbotEnv()
): RagChatbotConfig {
  return {
    ...readAiGatewayContractConfig(env, ragChatbotContract),
    databaseUrl: env.DATABASE_URL,
    embeddingModel: resolveRagChatbotEmbeddingModel(env),
  };
}

export function getRagChatbotDatabaseConfig(
  env: RagChatbotEnv = getRagChatbotEnv()
) {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. The RAG chatbot requires a writable pgvector database."
    );
  }

  return { databaseUrl };
}

export function getRagChatbotSetupState(
  env: RagChatbotEnv = getRagChatbotEnv()
): RagChatbotSetupState {
  return buildAiGatewayContractSetupState(env, {
    ...ragChatbotContract,
    buildConfig: (resolvedEnv, currentEnv) => ({
      baseURL: resolvedEnv.baseURL,
      chatModel: resolvedEnv.chatModel,
      embeddingModel: resolveRagChatbotEmbeddingModel(currentEnv),
    }),
  });
}

export function getRagChatbotIndexSetupIssue(
  env: RagChatbotEnv = getRagChatbotEnv()
): string | null {
  if (!env.AI_GATEWAY_API_KEY) {
    return "AI_GATEWAY_API_KEY is missing. Source indexing requires embedding generation through AI Gateway.";
  }

  if (!env.DATABASE_URL) {
    return "DATABASE_URL is missing. Source indexing requires a writable pgvector database.";
  }

  return null;
}

export function createRagChatbotGateway(
  env: RagChatbotEnv = getRagChatbotEnv()
): RagChatbotGateway {
  return createAiGatewayFromContract(env, ragChatbotContract);
}
