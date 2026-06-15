import {
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
} from "@/lib/ai-gateway/contract";
import { getGenerativeUiAppEnv } from "./env-source";
import {
  DEFAULT_GENERATIVE_UI_CHAT_MODEL,
  resolveGenerativeUiChatModel,
} from "./model";

export const DEFAULT_GENERATIVE_UI_MODEL = DEFAULT_GENERATIVE_UI_CHAT_MODEL;

export type GenerativeUiEnv = AiGatewayEnvRecord;

export type GenerativeUiConfig = AiGatewayContractConfig;

export type GenerativeUiSetupState =
  AiGatewayContractSetupState<AiGatewaySetupConfig>;

export type GenerativeUiGateway = ReturnType<
  typeof createAiGatewayFromContract
>;

const generativeUiContract = {
  defaultChatModel: DEFAULT_GENERATIVE_UI_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using generative UI.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
} as const;

export function getGenerativeUiEnv(): GenerativeUiEnv {
  return getGenerativeUiAppEnv();
}

export const readGenerativeUiEnv = getGenerativeUiEnv;

export function getGenerativeUiConfig(
  env: GenerativeUiEnv = getGenerativeUiEnv()
): GenerativeUiConfig {
  return {
    ...readAiGatewayContractConfig(env, generativeUiContract),
    chatModel: resolveGenerativeUiChatModel(env),
  };
}

export function getGenerativeUiSetupState(
  env: GenerativeUiEnv = getGenerativeUiEnv()
): GenerativeUiSetupState {
  return buildAiGatewayContractSetupState(env, {
    ...generativeUiContract,
    buildConfig: (resolvedEnv) => ({
      baseURL: resolvedEnv.baseURL,
      chatModel: resolveGenerativeUiChatModel(env),
    }),
  });
}

export function createGenerativeUiGateway(
  env: GenerativeUiEnv = getGenerativeUiEnv()
): GenerativeUiGateway {
  return createAiGatewayFromContract(env, generativeUiContract);
}
