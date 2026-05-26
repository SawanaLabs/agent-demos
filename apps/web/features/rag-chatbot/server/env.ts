import { createGateway } from "ai";
import { getRagChatbotAppEnv } from "./env-source";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";
const MINIMUM_NODE_VERSION = "22.13.0";
const nodeVersionPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export type RagChatbotEnv = Record<string, string | undefined>;

export interface RagChatbotConfig {
  apiKey: string;
  baseURL: string;
  chatModel: string;
  databaseUrl: string | undefined;
  embeddingModel: string;
}

export interface RagChatbotSetupState {
  config: Omit<RagChatbotConfig, "apiKey" | "databaseUrl">;
  isReady: boolean;
  issues: string[];
  nodeVersion: string;
}

function parseNodeVersion(version: string): ParsedNodeVersion {
  const match = nodeVersionPattern.exec(version);
  const major = Number(match?.[1]);
  const minor = Number(match?.[2]);
  const patch = Number(match?.[3]);

  if (![major, minor, patch].every(Number.isInteger)) {
    throw new Error(`Unable to parse Node.js version: "${version}".`);
  }

  return { major, minor, patch };
}

function compareNodeVersions(
  left: ParsedNodeVersion,
  right: ParsedNodeVersion
): number {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

function assertSupportedNodeRuntime(version = process.version): void {
  const parsedVersion = parseNodeVersion(version);
  const minimumVersion = parseNodeVersion(MINIMUM_NODE_VERSION);

  if (compareNodeVersions(parsedVersion, minimumVersion) < 0) {
    throw new Error(
      `Node.js ${version} is unsupported. This demo workspace requires Node.js >=${MINIMUM_NODE_VERSION}.`
    );
  }
}

export function getRagChatbotEnv(): RagChatbotEnv {
  return getRagChatbotAppEnv();
}

function readRequiredEnv(env: RagChatbotEnv, name: keyof RagChatbotEnv) {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using the RAG chatbot.`
    );
  }

  return value;
}

function resolveRagChatbotEnv(env: RagChatbotEnv = getRagChatbotEnv()) {
  return {
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
    databaseUrl: env.DATABASE_URL,
    embeddingModel:
      env.AI_GATEWAY_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
  };
}

export function getRagChatbotConfig(
  env: RagChatbotEnv = getRagChatbotEnv()
): RagChatbotConfig {
  assertSupportedNodeRuntime();
  const resolvedEnv = resolveRagChatbotEnv(env);

  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: resolvedEnv.baseURL,
    chatModel: resolvedEnv.chatModel,
    databaseUrl: resolvedEnv.databaseUrl,
    embeddingModel: resolvedEnv.embeddingModel,
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
  const issues: string[] = [];
  const resolvedEnv = resolveRagChatbotEnv(env);

  try {
    assertSupportedNodeRuntime();
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Unsupported Node.js runtime."
    );
  }

  if (!resolvedEnv.apiKey) {
    issues.push(
      "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured."
    );
  }

  return {
    config: {
      baseURL: resolvedEnv.baseURL,
      chatModel: resolvedEnv.chatModel,
      embeddingModel: resolvedEnv.embeddingModel,
    },
    isReady: issues.length === 0,
    issues,
    nodeVersion: process.version,
  };
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
) {
  const { apiKey, baseURL } = getRagChatbotConfig(env);

  return createGateway({
    apiKey,
    baseURL,
  });
}
