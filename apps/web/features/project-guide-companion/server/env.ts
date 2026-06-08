import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/features/shared/ai-gateway/server/contract";
import { getProjectGuideCompanionAppEnv } from "./env-source";

export const DEFAULT_PROJECT_GUIDE_COMPANION_MODEL = "openai/gpt-4.1-mini";

export type ProjectGuideCompanionEnv = AiGatewayEnvRecord;

export type ProjectGuideCompanionConfig = AiGatewayContractConfig;

export type ProjectGuideCompanionSetupState =
  AiGatewayContractSetupState<AiGatewaySetupConfig>;

export type ProjectGuideCompanionGateway = ReturnType<
  typeof createAiGatewayFromContract
>;

const projectGuideCompanionContract = {
  defaultChatModel: DEFAULT_PROJECT_GUIDE_COMPANION_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the project guide companion.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The project guide companion can render, but chat requests will fail until it is configured.",
} as const;

export function getProjectGuideCompanionEnv(): ProjectGuideCompanionEnv {
  return getProjectGuideCompanionAppEnv();
}

export function getProjectGuideCompanionConfig(
  env: ProjectGuideCompanionEnv = getProjectGuideCompanionEnv()
): ProjectGuideCompanionConfig {
  return readAiGatewayContractConfig(env, projectGuideCompanionContract);
}

export function getProjectGuideCompanionSetupState(
  env: ProjectGuideCompanionEnv = getProjectGuideCompanionEnv()
): ProjectGuideCompanionSetupState {
  return buildAiGatewayContractSetupState(env, projectGuideCompanionContract);
}

export function createProjectGuideCompanionGateway(
  env: ProjectGuideCompanionEnv = getProjectGuideCompanionEnv()
): ProjectGuideCompanionGateway {
  return createAiGatewayFromContract(env, projectGuideCompanionContract);
}
