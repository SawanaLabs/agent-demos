import { getSandboxAgentAppEnv } from "./env-source";
import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  readAiGatewayContractConfig,
  type AiGatewayContractConfig,
  type AiGatewayContractSetupState,
  type AiGatewayEnvRecord,
  type AiGatewaySetupConfig,
} from "@/lib/ai-gateway/contract";

export const DEFAULT_SANDBOX_AGENT_CHAT_MODEL = "openai/gpt-5-mini";

export type SandboxAgentEnv = AiGatewayEnvRecord;

export interface SandboxAgentConfig extends AiGatewayContractConfig {}

export interface SandboxAgentSandboxTokenCredentials {
  projectId: string;
  teamId: string;
  token: string;
}

export interface SandboxAgentSandboxSetupState {
  authMode: "local" | "oidc" | "token";
  isReady: boolean;
  issues: string[];
  providerLabel: "Local sandbox" | "Vercel Sandbox";
  runtime: "node24";
}

export interface SandboxAgentSetupState
  extends AiGatewayContractSetupState<AiGatewaySetupConfig> {
  sandboxProvider: SandboxAgentSandboxSetupState["providerLabel"];
}

export type SandboxAgentGateway = ReturnType<typeof createAiGatewayFromContract>;

const sandboxAgentContract = {
  defaultChatModel: DEFAULT_SANDBOX_AGENT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the sandbox agent.",
  missingApiKeyIssue: "AI_GATEWAY_API_KEY is missing. The demo can render, but sandbox chat requests will fail until it is configured.",
} as const;

export function getSandboxAgentEnv(): SandboxAgentEnv {
  return getSandboxAgentAppEnv();
}

export function getSandboxAgentConfig(
  env: SandboxAgentEnv = getSandboxAgentEnv()
): SandboxAgentConfig {
  return readAiGatewayContractConfig(env, sandboxAgentContract);
}

export function hasSandboxAgentSandboxTokenCredentials(env: SandboxAgentEnv) {
  return Boolean(
    env.VERCEL_PROJECT_ID && env.VERCEL_TEAM_ID && env.VERCEL_TOKEN
  );
}

export function getSandboxAgentSandboxTokenCredentials(
  env: SandboxAgentEnv = getSandboxAgentEnv()
): SandboxAgentSandboxTokenCredentials {
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

export function getSandboxAgentSandboxSetupState(
  env: SandboxAgentEnv = getSandboxAgentEnv()
): SandboxAgentSandboxSetupState {
  const issues: string[] = [];
  const hasOidc = Boolean(env.VERCEL_OIDC_TOKEN);
  const hasAnyTokenCredential = Boolean(
    env.VERCEL_PROJECT_ID || env.VERCEL_TEAM_ID || env.VERCEL_TOKEN
  );
  let authMode: SandboxAgentSandboxSetupState["authMode"] = "local";

  if (hasOidc) {
    authMode = "oidc";
  } else if (hasSandboxAgentSandboxTokenCredentials(env)) {
    authMode = "token";
  }

  if (
    authMode === "local" &&
    hasAnyTokenCredential &&
    !hasSandboxAgentSandboxTokenCredentials(env)
  ) {
    issues.push(
      "Vercel Sandbox token credentials are incomplete. Set VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID together, or remove them to use local sandbox mode."
    );
  }

  return {
    authMode,
    isReady: issues.length === 0,
    issues,
    providerLabel: authMode === "local" ? "Local sandbox" : "Vercel Sandbox",
    runtime: "node24",
  };
}

export function getSandboxAgentSetupState(
  env: SandboxAgentEnv = getSandboxAgentEnv()
): SandboxAgentSetupState {
  const sandboxSetup = getSandboxAgentSandboxSetupState(env);
  const gatewaySetup = buildAiGatewayContractSetupState(env, {
    ...sandboxAgentContract,
    getAdditionalIssues: () => sandboxSetup.issues,
  });

  return {
    ...gatewaySetup,
    sandboxProvider: sandboxSetup.providerLabel,
  };
}

export function createSandboxAgentGateway(
  env: SandboxAgentEnv = getSandboxAgentEnv()
): SandboxAgentGateway {
  return createAiGatewayFromContract(env, sandboxAgentContract);
}
