import { createGateway } from "ai";
import { getStreamingChatShellAppEnv } from "./env-source";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";
const MINIMUM_NODE_VERSION = "22.13.0";
const nodeVersionPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export type StreamingChatShellEnv = Record<string, string | undefined>;

export interface StreamingChatShellConfig {
  apiKey: string;
  baseURL: string;
  chatModel: string;
}

export interface StreamingChatShellSetupState {
  config: Omit<StreamingChatShellConfig, "apiKey">;
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

export function getStreamingChatShellEnv(): StreamingChatShellEnv {
  return getStreamingChatShellAppEnv();
}

function readRequiredEnv(
  env: StreamingChatShellEnv,
  name: keyof StreamingChatShellEnv
) {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using the streaming chat shell.`
    );
  }

  return value;
}

function resolveStreamingChatShellEnv(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
) {
  return {
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
  };
}

export function getStreamingChatShellConfig(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
): StreamingChatShellConfig {
  assertSupportedNodeRuntime();
  const resolvedEnv = resolveStreamingChatShellEnv(env);

  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: resolvedEnv.baseURL,
    chatModel: resolvedEnv.chatModel,
  };
}

export function getStreamingChatShellSetupState(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
): StreamingChatShellSetupState {
  const issues: string[] = [];
  const resolvedEnv = resolveStreamingChatShellEnv(env);

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

export function createStreamingChatShellGateway(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
): ReturnType<typeof createGateway> {
  const { apiKey, baseURL } = getStreamingChatShellConfig(env);

  return createGateway({
    apiKey,
    baseURL,
  });
}
