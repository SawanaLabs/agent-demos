import { createGateway } from "ai";

import { getCustomerMemoryAgentAppEnv } from "./env-source";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";
const MINIMUM_NODE_VERSION = "22.13.0";
const nodeVersionPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export type CustomerMemoryAgentEnv = Record<string, string | undefined>;

export interface CustomerMemoryAgentConfig {
  apiKey: string;
  baseURL: string;
  chatModel: string;
  databaseUrl: string | undefined;
}

export interface CustomerMemoryAgentSetupState {
  config: Omit<CustomerMemoryAgentConfig, "apiKey" | "databaseUrl">;
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

export function getCustomerMemoryAgentEnv(): CustomerMemoryAgentEnv {
  return getCustomerMemoryAgentAppEnv();
}

function readRequiredEnv(
  env: CustomerMemoryAgentEnv,
  name: keyof CustomerMemoryAgentEnv
) {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using the memory and persistence agent.`
    );
  }

  return value;
}

function resolveCustomerMemoryAgentEnv(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
) {
  return {
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
    databaseUrl: env.DATABASE_URL,
  };
}

export function getCustomerMemoryAgentConfig(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
): CustomerMemoryAgentConfig {
  assertSupportedNodeRuntime();
  const resolvedEnv = resolveCustomerMemoryAgentEnv(env);

  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: resolvedEnv.baseURL,
    chatModel: resolvedEnv.chatModel,
    databaseUrl: resolvedEnv.databaseUrl,
  };
}

export function getCustomerMemoryAgentDatabaseConfig(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
) {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. The memory and persistence agent requires a writable Postgres database."
    );
  }

  return { databaseUrl };
}

export function getCustomerMemoryAgentSetupState(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
): CustomerMemoryAgentSetupState {
  const issues: string[] = [];
  const resolvedEnv = resolveCustomerMemoryAgentEnv(env);

  try {
    assertSupportedNodeRuntime();
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Unsupported Node.js runtime."
    );
  }

  if (!resolvedEnv.apiKey) {
    issues.push(
      "AI_GATEWAY_API_KEY is missing. The demo can render, but memory-agent chat requests will fail until it is configured."
    );
  }

  if (!resolvedEnv.databaseUrl) {
    issues.push(
      "DATABASE_URL is missing. The memory and persistence agent requires a writable Postgres database."
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

export function createCustomerMemoryAgentGateway(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
) {
  const { apiKey, baseURL } = getCustomerMemoryAgentConfig(env);

  return createGateway({
    apiKey,
    baseURL,
  });
}
