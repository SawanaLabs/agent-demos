import { createGateway } from "ai";

import { assertSupportedNodeRuntime } from "./runtime";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";
type DemoEnv = Record<string, string | undefined>;

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

function readRequiredEnv(env: DemoEnv, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local using the contract in .env.example.`
    );
  }

  return value;
}

export function getAiGatewayConfig(
  env: DemoEnv = process.env
): AiGatewayConfig {
  assertSupportedNodeRuntime();

  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
  };
}

export function getAiGatewaySetupState(
  env: DemoEnv = process.env
): AiGatewaySetupState {
  const issues: string[] = [];

  try {
    assertSupportedNodeRuntime();
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Unsupported Node.js runtime."
    );
  }

  if (!env.AI_GATEWAY_API_KEY) {
    issues.push(
      "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured."
    );
  }

  return {
    config: {
      baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
      chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
    },
    issues,
    isReady: issues.length === 0,
    nodeVersion: process.version,
  };
}

export function createAiGateway(
  env: DemoEnv = process.env
): ReturnType<typeof createGateway> {
  const { apiKey, baseURL } = getAiGatewayConfig(env);

  return createGateway({
    apiKey,
    baseURL,
  });
}
