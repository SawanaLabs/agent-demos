import { createGateway } from "ai";
import { getSkillsAgentAppEnv } from "./env-source";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
export const DEFAULT_SKILLS_AGENT_CHAT_MODEL = "openai/gpt-5-mini";
export const SKILLS_AGENT_SANDBOX_ENVIRONMENT_LABEL =
  "Node 24 + uv Python 3.13";
const MINIMUM_NODE_VERSION = "22.13.0";
const nodeVersionPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export type SkillsAgentEnv = Record<string, string | undefined>;

export interface SkillsAgentConfig {
  apiKey: string;
  baseURL: string;
  chatModel: string;
}

export interface SkillsAgentSandboxTokenCredentials {
  projectId: string;
  teamId: string;
  token: string;
}

export interface SkillsAgentSandboxSetupState {
  authMode: "missing" | "oidc" | "token";
  isReady: boolean;
  issues: string[];
  providerLabel: "Vercel Sandbox";
  runtime: "node24";
}

export interface SkillsAgentSetupState {
  config: Omit<SkillsAgentConfig, "apiKey">;
  isReady: boolean;
  issues: string[];
  nodeVersion: string;
  sandboxProvider: SkillsAgentSandboxSetupState["providerLabel"];
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

export function getSkillsAgentEnv(): SkillsAgentEnv {
  return getSkillsAgentAppEnv();
}

function readRequiredEnv(env: SkillsAgentEnv, name: keyof SkillsAgentEnv) {
  const value = env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local before using the skills agent.`
    );
  }

  return value;
}

function resolveSkillsAgentEnv(env: SkillsAgentEnv = getSkillsAgentEnv()) {
  return {
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_SKILLS_AGENT_CHAT_MODEL,
  };
}

export function getSkillsAgentConfig(
  env: SkillsAgentEnv = getSkillsAgentEnv()
): SkillsAgentConfig {
  assertSupportedNodeRuntime();
  const resolvedEnv = resolveSkillsAgentEnv(env);

  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: resolvedEnv.baseURL,
    chatModel: resolvedEnv.chatModel,
  };
}

export function hasSkillsAgentSandboxTokenCredentials(env: SkillsAgentEnv) {
  return Boolean(
    env.VERCEL_PROJECT_ID && env.VERCEL_TEAM_ID && env.VERCEL_TOKEN
  );
}

export function getSkillsAgentSandboxTokenCredentials(
  env: SkillsAgentEnv = getSkillsAgentEnv()
): SkillsAgentSandboxTokenCredentials {
  const { VERCEL_PROJECT_ID, VERCEL_TEAM_ID, VERCEL_TOKEN } = env;

  if (!(VERCEL_PROJECT_ID && VERCEL_TEAM_ID && VERCEL_TOKEN)) {
    throw new Error(
      "Vercel Sandbox token credentials are incomplete. Expected VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID."
    );
  }

  return {
    projectId: VERCEL_PROJECT_ID,
    teamId: VERCEL_TEAM_ID,
    token: VERCEL_TOKEN,
  };
}

export function getSkillsAgentSandboxSetupState(
  env: SkillsAgentEnv = getSkillsAgentEnv()
): SkillsAgentSandboxSetupState {
  const issues: string[] = [];
  const hasOidc = Boolean(env.VERCEL_OIDC_TOKEN);
  let authMode: SkillsAgentSandboxSetupState["authMode"] = "missing";

  if (hasOidc) {
    authMode = "oidc";
  } else if (hasSkillsAgentSandboxTokenCredentials(env)) {
    authMode = "token";
  }

  if (authMode === "missing") {
    issues.push(
      "Vercel Sandbox credentials are missing. Add VERCEL_OIDC_TOKEN or the VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID trio."
    );
  }

  return {
    authMode,
    isReady: issues.length === 0,
    issues,
    providerLabel: "Vercel Sandbox",
    runtime: "node24",
  };
}

export function getSkillsAgentSetupState(
  env: SkillsAgentEnv = getSkillsAgentEnv()
): SkillsAgentSetupState {
  const issues: string[] = [];
  const resolvedEnv = resolveSkillsAgentEnv(env);
  const sandboxSetup = getSkillsAgentSandboxSetupState(env);

  try {
    assertSupportedNodeRuntime();
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Unsupported Node.js runtime."
    );
  }

  if (!resolvedEnv.apiKey) {
    issues.push(
      "AI_GATEWAY_API_KEY is missing. The demo can render, but skills-agent chat requests will fail until it is configured."
    );
  }

  issues.push(...sandboxSetup.issues);

  return {
    config: {
      baseURL: resolvedEnv.baseURL,
      chatModel: resolvedEnv.chatModel,
    },
    isReady: issues.length === 0,
    issues,
    nodeVersion: process.version,
    sandboxProvider: sandboxSetup.providerLabel,
  };
}

export function createSkillsAgentGateway(
  env: SkillsAgentEnv = getSkillsAgentEnv()
): ReturnType<typeof createGateway> {
  const { apiKey, baseURL } = getSkillsAgentConfig(env);

  return createGateway({
    apiKey,
    baseURL,
  });
}
