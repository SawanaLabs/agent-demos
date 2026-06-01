import { getSkillsAgentAppEnv } from "./env-source";
import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";

export const DEFAULT_SKILLS_AGENT_CHAT_MODEL = "openai/gpt-5-mini";
export const SKILLS_AGENT_SANDBOX_ENVIRONMENT_LABEL =
  "Node 24 + uv Python 3.13";

export type SkillsAgentEnv = AiGatewayEnvRecord;

export interface SkillsAgentConfig extends AiGatewayContractConfig {}

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

export interface SkillsAgentSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {
  sandboxProvider: SkillsAgentSandboxSetupState["providerLabel"];
}

export type SkillsAgentGateway = ReturnType<typeof createAiGatewayFromContract>;

const skillsAgentContract = {
  defaultChatModel: DEFAULT_SKILLS_AGENT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the skills agent.",
  missingApiKeyIssue: "AI_GATEWAY_API_KEY is missing. The demo can render, but skills-agent chat requests will fail until it is configured.",
} as const;

export function getSkillsAgentEnv(): SkillsAgentEnv {
  return getSkillsAgentAppEnv();
}

export function getSkillsAgentConfig(
  env: SkillsAgentEnv = getSkillsAgentEnv()
): SkillsAgentConfig {
  return readAiGatewayContractConfig(env, skillsAgentContract);
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
  const sandboxSetup = getSkillsAgentSandboxSetupState(env);
  const gatewaySetup = buildAiGatewayContractSetupState(env, {
    ...skillsAgentContract,
    getAdditionalIssues: () => sandboxSetup.issues,
  });

  return {
    ...gatewaySetup,
    sandboxProvider: sandboxSetup.providerLabel,
  };
}

export function createSkillsAgentGateway(
  env: SkillsAgentEnv = getSkillsAgentEnv()
): SkillsAgentGateway {
  return createAiGatewayFromContract(env, skillsAgentContract);
}
