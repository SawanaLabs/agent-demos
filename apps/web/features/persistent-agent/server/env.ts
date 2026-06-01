import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getPersistentAgentAppEnv } from "./env-source";

const DEFAULT_PERSISTENT_AGENT_CHAT_MODEL = "openai/gpt-5-mini";
const missingDatabaseUrlIssue =
  "DATABASE_URL is missing. Persistent-agent chat storage requires a writable Postgres database.";
const missingRedisUrlIssue =
  "REDIS_URL is missing. Persistent-agent resume requires Redis-backed resumable streams.";

export type PersistentAgentEnv = AiGatewayEnvRecord;

export interface PersistentAgentConfig extends AiGatewayContractConfig {
  databaseUrl: string | undefined;
  redisUrl: string | undefined;
}

export interface PersistentAgentSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {}

export type PersistentAgentGateway = ReturnType<
  typeof createAiGatewayFromContract
>;

const persistentAgentContract = {
  defaultChatModel: DEFAULT_PERSISTENT_AGENT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the persistent agent.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but persistent-agent chat requests will fail until it is configured.",
} as const;

export function getPersistentAgentEnv(): PersistentAgentEnv {
  return getPersistentAgentAppEnv();
}

export function getPersistentAgentConfig(
  env: PersistentAgentEnv = getPersistentAgentEnv()
): PersistentAgentConfig {
  return {
    ...readAiGatewayContractConfig(env, persistentAgentContract),
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
  };
}

export function getPersistentAgentDatabaseConfig(
  env: PersistentAgentEnv = getPersistentAgentEnv()
) {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(missingDatabaseUrlIssue);
  }

  return { databaseUrl };
}

export function getPersistentAgentRedisConfig(
  env: PersistentAgentEnv = getPersistentAgentEnv()
) {
  const redisUrl = env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(missingRedisUrlIssue);
  }

  return { redisUrl };
}

export function getPersistentAgentSetupState(
  env: PersistentAgentEnv = getPersistentAgentEnv()
): PersistentAgentSetupState {
  return buildAiGatewayContractSetupState(env, {
    ...persistentAgentContract,
    getAdditionalIssues: (_resolvedEnv, currentEnv) => [
      ...(currentEnv.DATABASE_URL ? [] : [missingDatabaseUrlIssue]),
      ...(currentEnv.REDIS_URL ? [] : [missingRedisUrlIssue]),
    ],
  });
}

export function createPersistentAgentGateway(
  env: PersistentAgentEnv = getPersistentAgentEnv()
): PersistentAgentGateway {
  return createAiGatewayFromContract(env, persistentAgentContract);
}
