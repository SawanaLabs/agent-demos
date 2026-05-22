import { createGateway } from "ai";

import { env as appEnv } from "@/env";

import { DEFAULT_CHAT_MODEL, DEFAULT_GATEWAY_BASE_URL } from "./keys";
import { assertSupportedNodeRuntime } from "./runtime";

interface AiGatewayEnv {
  AI_GATEWAY_API_KEY?: string;
  AI_GATEWAY_BASE_URL?: string;
  AI_GATEWAY_CHAT_MODEL?: string;
}

export interface AiGatewayConfig {
  apiKey: string;
  baseURL: string;
  chatModel: string;
}

export interface AiGatewaySetupState {
  config: Omit<AiGatewayConfig, "apiKey">;
  isReady: boolean;
  issues: string[];
  nodeVersion: string;
}

function readRequiredEnv(env: AiGatewayEnv, name: keyof AiGatewayEnv): string {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to apps/web/.env.local using the contract in apps/web/.env.example.`
    );
  }

  return value;
}

function resolveAiGatewayEnv(env: AiGatewayEnv = appEnv) {
  return {
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
  };
}

export function getAiGatewayConfig(
  env: AiGatewayEnv = appEnv
): AiGatewayConfig {
  assertSupportedNodeRuntime();
  const resolvedEnv = resolveAiGatewayEnv(env);

  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: resolvedEnv.baseURL,
    chatModel: resolvedEnv.chatModel,
  };
}

export function getAiGatewaySetupState(
  env: AiGatewayEnv = appEnv
): AiGatewaySetupState {
  const issues: string[] = [];
  const resolvedEnv = resolveAiGatewayEnv(env);

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
    },
    issues,
    isReady: issues.length === 0,
    nodeVersion: process.version,
  };
}

export function createAiGateway(
  env: AiGatewayEnv = appEnv
): ReturnType<typeof createGateway> {
  const { apiKey, baseURL } = getAiGatewayConfig(env);

  return createGateway({
    apiKey,
    baseURL,
  });
}
