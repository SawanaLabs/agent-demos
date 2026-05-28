import { getLangGraphAgentAppEnv } from "./env-source";

const MINIMUM_NODE_VERSION = "22.13.0";
export const DEFAULT_LANGGRAPH_AGENT_MODEL = "openai/gpt-5-mini";
const nodeVersionPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export type LangGraphAgentEnv = Record<string, string | undefined>;

export interface LangGraphAgentConfig {
  apiKey?: string;
  assistantId: string;
  baseUrl: string;
  modelName: string;
}

export interface LangGraphAgentSetupState {
  config: Partial<LangGraphAgentConfig>;
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

function readRequiredEnv(
  env: LangGraphAgentEnv,
  name: keyof LangGraphAgentEnv
) {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using the LangGraph agent demo.`
    );
  }

  return value;
}

export function getLangGraphAgentEnv(): LangGraphAgentEnv {
  return getLangGraphAgentAppEnv();
}

export function getLangGraphAgentConfig(
  env: LangGraphAgentEnv = getLangGraphAgentEnv()
): LangGraphAgentConfig {
  assertSupportedNodeRuntime();

  return {
    apiKey: env.LANGGRAPH_AGENT_API_KEY,
    assistantId: readRequiredEnv(env, "LANGGRAPH_AGENT_ASSISTANT_ID"),
    baseUrl: readRequiredEnv(env, "LANGGRAPH_AGENT_API_URL"),
    modelName: env.LANGGRAPH_AGENT_MODEL ?? DEFAULT_LANGGRAPH_AGENT_MODEL,
  };
}

export function getLangGraphAgentSetupState(
  env: LangGraphAgentEnv = getLangGraphAgentEnv()
): LangGraphAgentSetupState {
  const issues: string[] = [];

  try {
    assertSupportedNodeRuntime();
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Unsupported Node.js runtime."
    );
  }

  if (!env.LANGGRAPH_AGENT_API_URL) {
    issues.push(
      "LANGGRAPH_AGENT_API_URL is missing. Point it at a LangGraph Agent Server before using this demo."
    );
  }

  if (!env.LANGGRAPH_AGENT_ASSISTANT_ID) {
    issues.push(
      "LANGGRAPH_AGENT_ASSISTANT_ID is missing. Set it to the graph id exposed by langgraph.json or your LangGraph deployment."
    );
  }

  return {
    config: {
      apiKey: env.LANGGRAPH_AGENT_API_KEY,
      assistantId: env.LANGGRAPH_AGENT_ASSISTANT_ID,
      baseUrl: env.LANGGRAPH_AGENT_API_URL,
      modelName: env.LANGGRAPH_AGENT_MODEL ?? DEFAULT_LANGGRAPH_AGENT_MODEL,
    },
    isReady: issues.length === 0,
    issues,
    nodeVersion: process.version,
  };
}
