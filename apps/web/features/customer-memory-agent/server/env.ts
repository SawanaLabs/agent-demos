import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getCustomerMemoryAgentAppEnv } from "./env-source";

const DEFAULT_CUSTOMER_MEMORY_AGENT_CHAT_MODEL = "openai/gpt-4.1-mini";
const missingDatabaseUrlIssue =
  "DATABASE_URL is missing. The memory and persistence agent requires a writable Postgres database.";

export type CustomerMemoryAgentEnv = AiGatewayEnvRecord;

export interface CustomerMemoryAgentConfig extends AiGatewayContractConfig {
  databaseUrl: string | undefined;
}

export interface CustomerMemoryAgentSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {}

export type CustomerMemoryAgentGateway = ReturnType<
  typeof createAiGatewayFromContract
>;

const customerMemoryAgentContract = {
  defaultChatModel: DEFAULT_CUSTOMER_MEMORY_AGENT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the memory and persistence agent.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but memory-agent chat requests will fail until it is configured.",
} as const;

export function getCustomerMemoryAgentEnv(): CustomerMemoryAgentEnv {
  return getCustomerMemoryAgentAppEnv();
}

export function getCustomerMemoryAgentConfig(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
): CustomerMemoryAgentConfig {
  return {
    ...readAiGatewayContractConfig(env, customerMemoryAgentContract),
    databaseUrl: env.DATABASE_URL,
  };
}

export function getCustomerMemoryAgentDatabaseConfig(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
) {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(missingDatabaseUrlIssue);
  }

  return { databaseUrl };
}

export function getCustomerMemoryAgentSetupState(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
): CustomerMemoryAgentSetupState {
  return buildAiGatewayContractSetupState(env, {
    ...customerMemoryAgentContract,
    getAdditionalIssues: (_resolvedEnv, currentEnv) =>
      currentEnv.DATABASE_URL ? [] : [missingDatabaseUrlIssue],
  });
}

export function createCustomerMemoryAgentGateway(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
): CustomerMemoryAgentGateway {
  return createAiGatewayFromContract(env, customerMemoryAgentContract);
}
