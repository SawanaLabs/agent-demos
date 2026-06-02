import { env as appEnv } from "@/env";

export interface VercelSandboxEnv {
  VERCEL_OIDC_TOKEN?: string;
  VERCEL_PROJECT_ID?: string;
  VERCEL_SANDBOX_INTEGRATION?: string;
  VERCEL_TEAM_ID?: string;
  VERCEL_TOKEN?: string;
}

export interface VercelSandboxTokenCredentials {
  projectId: string;
  teamId: string;
  token: string;
}

export interface VercelSandboxSetupState {
  authMode: "missing" | "oidc" | "token";
  isReady: boolean;
  issues: string[];
  providerLabel: "Vercel Sandbox";
  runtime: "node24";
}

export function hasVercelSandboxTokenCredentials(env: VercelSandboxEnv) {
  return Boolean(
    env.VERCEL_PROJECT_ID && env.VERCEL_TEAM_ID && env.VERCEL_TOKEN
  );
}

export function getVercelSandboxTokenCredentials(
  env: VercelSandboxEnv = appEnv
): VercelSandboxTokenCredentials {
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

export function getVercelSandboxSetupState(
  env: VercelSandboxEnv = appEnv
): VercelSandboxSetupState {
  const issues: string[] = [];
  const hasOidc = Boolean(env.VERCEL_OIDC_TOKEN);
  let authMode: VercelSandboxSetupState["authMode"] = "missing";

  if (hasOidc) {
    authMode = "oidc";
  } else if (hasVercelSandboxTokenCredentials(env)) {
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

export function assertVercelSandboxIntegrationReady(
  env: VercelSandboxEnv = appEnv
) {
  if (env.VERCEL_SANDBOX_INTEGRATION !== "1") {
    throw new Error(
      "Vercel Sandbox integration tests are disabled. Set VERCEL_SANDBOX_INTEGRATION=1 to run real provider-backed tests."
    );
  }

  const setupState = getVercelSandboxSetupState(env);

  if (!setupState.isReady) {
    throw new Error(setupState.issues.join(" "));
  }

  if (setupState.authMode !== "oidc") {
    throw new Error(
      "Vercel Sandbox integration tests require VERCEL_OIDC_TOKEN so they verify the OIDC authentication path. Run `vercel link` and `vercel env pull` to refresh local credentials. Use access-token credentials only for external CI/CD or non-Vercel hosting."
    );
  }

  return setupState;
}
