import { getObjectGenerationAppEnv } from "./env-source";
import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";

export const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";

export type ObjectGenerationEnv = AiGatewayEnvRecord;

export interface ObjectGenerationConfig extends AiGatewayContractConfig {}

export interface ObjectGenerationSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {}

export type ObjectGenerationGateway = ReturnType<typeof createAiGatewayFromContract>;

const objectGenerationContract = {
  defaultChatModel: DEFAULT_CHAT_MODEL,
  missingApiKeyError: "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using object generation.",
  missingApiKeyIssue: "AI_GATEWAY_API_KEY is missing. The demo can render, but object generation requests will fail until it is configured.",
} as const;

export function getObjectGenerationEnv(): ObjectGenerationEnv {
  return getObjectGenerationAppEnv();
}

export function getObjectGenerationConfig(
  env: ObjectGenerationEnv = getObjectGenerationEnv()
): ObjectGenerationConfig {
  return readAiGatewayContractConfig(env, objectGenerationContract);
}

export function getObjectGenerationSetupState(
  env: ObjectGenerationEnv = getObjectGenerationEnv()
): ObjectGenerationSetupState {
  return buildAiGatewayContractSetupState(env, objectGenerationContract);
}

export function createObjectGenerationGateway(
  env: ObjectGenerationEnv = getObjectGenerationEnv()
): ObjectGenerationGateway {
  return createAiGatewayFromContract(env, objectGenerationContract);
}
