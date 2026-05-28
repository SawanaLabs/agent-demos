import { createGateway } from "ai";
import { getLoopAgentAppEnv } from "./env-source";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
export const DEFAULT_LOOP_AGENT_CHAT_MODEL = "openai/gpt-5-mini";
const MINIMUM_NODE_VERSION = "22.13.0";
const nodeVersionPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export type LoopAgentEnv = Record<string, string | undefined>;

export interface LoopAgentConfig {
  apiKey: string;
  baseURL: string;
  chatModel: string;
}

export interface LoopAgentSetupState {
  config: Omit<LoopAgentConfig, "apiKey">;
  isReady: boolean;
  issues: string[];
  nodeVersion: string;
}

function parseNodeVersion(version: string): ParsedNodeVersion {
  const match = nodeVersionPattern.exec(version);
  const major = Number(match?.[1]);
  const minor = Number(match?.[2]);
  const patch = Number(match?.[3]);

  if (![major, minor, patch].every(Number.isInteger)) {
    throw new Error(`Unable to parse Node.js version: "${version}".`);
  }

  return { major, minor, patch };
}

function compareNodeVersions(
  left: ParsedNodeVersion,
  right: ParsedNodeVersion
) {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

function assertSupportedNodeRuntime(version = process.version) {
  const parsedVersion = parseNodeVersion(version);
  const minimumVersion = parseNodeVersion(MINIMUM_NODE_VERSION);

  if (compareNodeVersions(parsedVersion, minimumVersion) < 0) {
    throw new Error(
      `Node.js ${version} is unsupported. This demo workspace requires Node.js >=${MINIMUM_NODE_VERSION}.`
    );
  }
}

export function getLoopAgentEnv(): LoopAgentEnv {
  return getLoopAgentAppEnv();
}

function readRequiredEnv(env: LoopAgentEnv, name: keyof LoopAgentEnv) {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using the loop agent.`
    );
  }

  return value;
}

function resolveLoopAgentEnv(env: LoopAgentEnv = getLoopAgentEnv()) {
  return {
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_LOOP_AGENT_CHAT_MODEL,
  };
}

export function getLoopAgentConfig(
  env: LoopAgentEnv = getLoopAgentEnv()
): LoopAgentConfig {
  assertSupportedNodeRuntime();
  const resolvedEnv = resolveLoopAgentEnv(env);

  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: resolvedEnv.baseURL,
    chatModel: resolvedEnv.chatModel,
  };
}

export function getLoopAgentSetupState(
  env: LoopAgentEnv = getLoopAgentEnv()
): LoopAgentSetupState {
  const issues: string[] = [];
  const resolvedEnv = resolveLoopAgentEnv(env);

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
    isReady: issues.length === 0,
    issues,
    nodeVersion: process.version,
  };
}

export function createLoopAgentGateway(
  env: LoopAgentEnv = getLoopAgentEnv()
): ReturnType<typeof createGateway> {
  const { apiKey, baseURL } = getLoopAgentConfig(env);

  return createGateway({
    apiKey,
    baseURL,
  });
}
