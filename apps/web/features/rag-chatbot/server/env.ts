import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { canUseOpenAIPlatform } from "@/features/shared/ai-gateway/server/openai-platform";
import { getRagChatbotAppEnv } from "./env-source";

const DEFAULT_RAG_CHATBOT_CHAT_MODEL = "openai/gpt-4.1-mini";
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";
const missingEmbeddingCredentials =
  "The configured embedding model requires AI_GATEWAY_API_KEY, or OPENAI_API_KEY for an OpenAI model.";

export type RagChatbotEnv = AiGatewayEnvRecord;

export interface RagChatbotConfig extends AiGatewayContractConfig {
  databaseUrl: string | undefined;
  embeddingModel: string;
}

export interface RagChatbotSetupConfig extends AiGatewaySetupConfig {
  embeddingModel: string;
}

export type RagChatbotSetupState =
  AiGatewayContractSetupState<RagChatbotSetupConfig>;

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

export function resolveRagChatbotEmbeddingModel(env: RagChatbotEnv) {
  return env.AI_GATEWAY_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
}

function hasRagEmbeddingCredentials(env: RagChatbotEnv) {
  return (
    Boolean(env.AI_GATEWAY_API_KEY) ||
    canUseOpenAIPlatform(
      env.OPENAI_API_KEY,
      resolveRagChatbotEmbeddingModel(env)
    )
  );
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
    getAdditionalIssues: (_, currentEnv) =>
      hasRagEmbeddingCredentials(currentEnv)
        ? []
        : [missingEmbeddingCredentials],
  });
}

export function getRagChatbotIndexSetupIssue(
  env: RagChatbotEnv = getRagChatbotEnv()
): string | null {
  if (!hasRagEmbeddingCredentials(env)) {
    return missingEmbeddingCredentials;
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
