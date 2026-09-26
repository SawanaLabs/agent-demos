import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";

import { getEveAgentAppEnv } from "./env-source";
import { type EveSupport, resolveEveSupport } from "./eve";

export const DEFAULT_EVE_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export type EveAgentEnv = AiGatewayEnvRecord;
export type EveAgentConfig = AiGatewayContractConfig;
export type EveAgentGateway = ReturnType<typeof createAiGatewayFromContract>;
export type EveAgentGatewaySetupState =
  AiGatewayContractSetupState<AiGatewaySetupConfig>;

export interface EveAgentSetupState extends EveAgentGatewaySetupState {
  eveStatus: EveSupport["status"];
}

const eveAgentContract = {
  defaultChatModel: DEFAULT_EVE_AGENT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using Eve Agent.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getEveAgentEnv(): EveAgentEnv {
  return getEveAgentAppEnv();
}

export function getEveAgentConfig(
  env: EveAgentEnv = getEveAgentEnv()
): EveAgentConfig {
  return readAiGatewayContractConfig(env, eveAgentContract);
}

export function getEveAgentGatewaySetupState(
  env: EveAgentEnv = getEveAgentEnv()
): EveAgentGatewaySetupState {
  return buildAiGatewayContractSetupState(env, eveAgentContract);
}

export function createEveAgentGateway(
  env: EveAgentEnv = getEveAgentEnv()
): EveAgentGateway {
  return createAiGatewayFromContract(env, eveAgentContract);
}

export async function getEveAgentSetupState(
  env: EveAgentEnv = getEveAgentEnv(),
  resolveSupport: () => Promise<EveSupport> = resolveEveSupport
): Promise<EveAgentSetupState> {
  const gatewaySetup = getEveAgentGatewaySetupState(env);
  const support = await resolveSupport();
  const issues =
    support.status === "ready"
      ? [...gatewaySetup.issues]
      : [...gatewaySetup.issues, support.issue];

  return {
    ...gatewaySetup,
    eveStatus: support.status,
    isReady: issues.length === 0,
    issues,
  };
}
