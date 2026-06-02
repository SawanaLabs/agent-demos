import {
  copyLocalPathToSandbox as copySharedLocalPathToSandbox,
  createVercelSandbox as createSharedVercelSandbox,
  createVercelSandboxSessionRegistry as createSharedVercelSandboxSessionRegistry,
  VERCEL_SANDBOX_AGENTS_FILE as SHARED_VERCEL_SANDBOX_AGENTS_FILE,
  VERCEL_SANDBOX_ARTIFACTS_ROOT as SHARED_VERCEL_SANDBOX_ARTIFACTS_ROOT,
  VERCEL_SANDBOX_PROJECT_ROOT as SHARED_VERCEL_SANDBOX_PROJECT_ROOT,
  VERCEL_SANDBOX_SKILLS_ROOT as SHARED_VERCEL_SANDBOX_SKILLS_ROOT,
  VERCEL_SANDBOX_WORKSPACE_ROOT as SHARED_VERCEL_SANDBOX_WORKSPACE_ROOT,
  type VercelSandboxHandle,
  type VercelSandboxSessionRegistry,
} from "@/features/shared/vercel-sandbox/server/session";
import { getSandboxAgentEnv, type SandboxAgentEnv } from "./env";

export type {
  VercelSandboxFactory,
  VercelSandboxHandle,
  VercelSandboxSession,
  VercelSandboxSessionRegistry,
} from "@/features/shared/vercel-sandbox/server/session";

export const copyLocalPathToSandbox = copySharedLocalPathToSandbox;
export const createVercelSandboxSessionRegistry =
  createSharedVercelSandboxSessionRegistry;
export const VERCEL_SANDBOX_AGENTS_FILE = SHARED_VERCEL_SANDBOX_AGENTS_FILE;
export const VERCEL_SANDBOX_ARTIFACTS_ROOT =
  SHARED_VERCEL_SANDBOX_ARTIFACTS_ROOT;
export const VERCEL_SANDBOX_PROJECT_ROOT = SHARED_VERCEL_SANDBOX_PROJECT_ROOT;
export const VERCEL_SANDBOX_SKILLS_ROOT = SHARED_VERCEL_SANDBOX_SKILLS_ROOT;
export const VERCEL_SANDBOX_WORKSPACE_ROOT =
  SHARED_VERCEL_SANDBOX_WORKSPACE_ROOT;

export function createVercelSandbox(
  sessionId: string,
  env: SandboxAgentEnv = getSandboxAgentEnv(),
  options: {
    ports?: number[];
  } = {}
): Promise<VercelSandboxHandle> {
  return createSharedVercelSandbox(sessionId, env, options);
}

let sharedRegistry: VercelSandboxSessionRegistry | null = null;

export function getSharedVercelSandboxSessionRegistry(
  env: SandboxAgentEnv = getSandboxAgentEnv()
) {
  sharedRegistry ??= createSharedVercelSandboxSessionRegistry({
    createSandbox: (sessionId) => createVercelSandbox(sessionId, env),
  });

  return sharedRegistry;
}
