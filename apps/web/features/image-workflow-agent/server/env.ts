import { createGateway } from "ai";

import {
  type AiGatewayEnvRecord,
  assertSupportedNodeRuntime,
  DEFAULT_GATEWAY_BASE_URL,
} from "../../shared/ai-gateway/server/contract";
import { DEFAULT_CHAT_MODEL } from "../../shared/ai-gateway/server/keys";

export const DEFAULT_IMAGE_WORKFLOW_AGENT_IMAGE_MODEL =
  "google/gemini-3.1-flash-lite-image";

const missingCredentialsError =
  "Missing AI gateway credentials. Set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN before using the image workflow agent.";
const missingCredentialsIssue =
  "AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN is missing. The demo can render, but workflow runs will fail until credentials are configured.";

export type ImageWorkflowAgentEnv = AiGatewayEnvRecord;
export type ImageWorkflowAgentGateway = ReturnType<typeof createGateway>;

export interface ImageWorkflowAgentConfig {
  apiKey: string | null;
  baseURL: string;
  chatModel: string;
  imageModel: string;
  oidcToken: string | null;
}

export interface ImageWorkflowAgentSetupState {
  config: Omit<ImageWorkflowAgentConfig, "apiKey" | "oidcToken">;
  isReady: boolean;
  issues: string[];
  nodeVersion: string;
}

export function getImageWorkflowAgentEnv(): ImageWorkflowAgentEnv {
  return process.env;
}

export function resolveImageWorkflowAgentConfig(
  env: ImageWorkflowAgentEnv
): ImageWorkflowAgentConfig {
  return {
    apiKey: env.AI_GATEWAY_API_KEY ?? null,
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
    imageModel:
      env.AI_GATEWAY_IMAGE_MODEL || DEFAULT_IMAGE_WORKFLOW_AGENT_IMAGE_MODEL,
    oidcToken: env.VERCEL_OIDC_TOKEN ?? null,
  };
}

export function readImageWorkflowAgentConfig(
  env: ImageWorkflowAgentEnv = getImageWorkflowAgentEnv()
): ImageWorkflowAgentConfig {
  assertSupportedNodeRuntime();
  const config = resolveImageWorkflowAgentConfig(env);

  if (!(config.apiKey || config.oidcToken)) {
    throw new Error(missingCredentialsError);
  }

  return config;
}

export function getImageWorkflowAgentSetupState(
  env: ImageWorkflowAgentEnv = getImageWorkflowAgentEnv()
): ImageWorkflowAgentSetupState {
  const issues: string[] = [];
  const config = resolveImageWorkflowAgentConfig(env);

  try {
    assertSupportedNodeRuntime();
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Unsupported Node.js runtime."
    );
  }

  if (!(config.apiKey || config.oidcToken)) {
    issues.push(missingCredentialsIssue);
  }

  return {
    config: {
      baseURL: config.baseURL,
      chatModel: config.chatModel,
      imageModel: config.imageModel,
    },
    isReady: issues.length === 0,
    issues,
    nodeVersion: process.version,
  };
}

export function createImageWorkflowAgentGateway(
  env: ImageWorkflowAgentEnv = getImageWorkflowAgentEnv()
): ImageWorkflowAgentGateway {
  const config = readImageWorkflowAgentConfig(env);

  return createGateway({
    apiKey: config.apiKey ?? undefined,
    baseURL: config.baseURL,
    headers: config.apiKey
      ? undefined
      : {
          Authorization: `Bearer ${config.oidcToken}`,
        },
  });
}
