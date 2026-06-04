import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";

const DEFAULT_ULTRA_CHATBOT_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export type UltraChatbotAgentEnv = AiGatewayEnvRecord & {
  BLOB_READ_WRITE_TOKEN?: string;
  CRON_SECRET?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  VERCEL_OIDC_TOKEN?: string;
  VERCEL_PROJECT_ID?: string;
  VERCEL_TEAM_ID?: string;
  VERCEL_TOKEN?: string;
};

export interface UltraChatbotAgentConfig extends AiGatewayContractConfig {
  databaseUrl: string | undefined;
}

export type UltraChatbotAgentSetupState =
  AiGatewayContractSetupState<AiGatewaySetupConfig>;

export interface DatabaseSetupState {
  isReady: boolean;
  issues: string[];
}

export type AiGatewayProvider = ReturnType<typeof createAiGatewayFromContract>;

const ultraChatbotAgentContract = {
  defaultChatModel: DEFAULT_ULTRA_CHATBOT_AGENT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using Ultra Chatbot Agent.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. Ultra can render, but chat requests will fail until it is configured.",
} as const;

export function getUltraChatbotAgentAppEnv(): UltraChatbotAgentEnv {
  // biome-ignore lint/style/noProcessEnv: Registry source installs into consumer apps without this repo's env wrapper.
  return process.env;
}

export function getAiGatewayConfig(
  env: UltraChatbotAgentEnv = getUltraChatbotAgentAppEnv()
): UltraChatbotAgentConfig {
  return {
    ...readAiGatewayContractConfig(env, ultraChatbotAgentContract),
    databaseUrl: env.DATABASE_URL,
  };
}

export function getAiGatewaySetupState(
  env: UltraChatbotAgentEnv = getUltraChatbotAgentAppEnv()
): UltraChatbotAgentSetupState {
  return buildAiGatewayContractSetupState(env, ultraChatbotAgentContract);
}

export function createAiGateway(
  env: UltraChatbotAgentEnv = getUltraChatbotAgentAppEnv()
): AiGatewayProvider {
  return createAiGatewayFromContract(env, ultraChatbotAgentContract);
}

export function getDatabaseSetupState(
  env: UltraChatbotAgentEnv = getUltraChatbotAgentAppEnv()
): DatabaseSetupState {
  const issues = env.DATABASE_URL
    ? []
    : [
        "DATABASE_URL is missing. Ultra Chatbot Agent requires a writable Postgres database for chats, messages, votes, documents, suggestions, and stream metadata.",
      ];

  return {
    isReady: issues.length === 0,
    issues,
  };
}

export function getUltraChatbotAgentDatabaseConfig(
  env: UltraChatbotAgentEnv = getUltraChatbotAgentAppEnv()
) {
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add it to .env.local before using Ultra Chatbot Agent persistence."
    );
  }

  return { databaseUrl: env.DATABASE_URL };
}

export interface VercelBlobEnv {
  BLOB_READ_WRITE_TOKEN?: string;
}

export function getVercelBlobToken(
  env: VercelBlobEnv = getUltraChatbotAgentAppEnv()
) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Add it to .env.local using a Vercel Blob store before using file uploads."
    );
  }

  return env.BLOB_READ_WRITE_TOKEN;
}

export interface CronEnv {
  CRON_SECRET?: string;
}

export function getCronSecretError() {
  return "CRON_SECRET is missing. Cleanup cron routes require an authenticated secret.";
}

export function getCronSecret(env: CronEnv = getUltraChatbotAgentAppEnv()) {
  if (!env.CRON_SECRET) {
    throw new Error(getCronSecretError());
  }

  return env.CRON_SECRET;
}
