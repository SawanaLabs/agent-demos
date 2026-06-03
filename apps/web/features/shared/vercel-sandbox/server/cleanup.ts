import { Sandbox } from "@vercel/sandbox";
import { env as appEnv } from "@/env";
import { demoDataRetentionDays } from "@/features/shared/demo-data-retention/server/policy";
import {
  getVercelSandboxSetupState,
  getVercelSandboxTokenCredentials,
  type VercelSandboxEnv,
  type VercelSandboxTokenCredentials,
} from "./env";
import { VERCEL_SANDBOX_DEMO_APP_TAG } from "./session";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const vercelSandboxCleanupRetentionDays = demoDataRetentionDays;
export const vercelSandboxCleanupCronScheduleUtc = "0 21 * * *";

interface ListedVercelSandboxIdentity {
  createdAt?: number | string | Date;
  name: string;
  tags?: Record<string, string>;
  updatedAt?: number | string | Date;
}

type VercelSandboxCleanupAuth =
  | {
      authMode: "oidc";
    }
  | {
      authMode: "token";
      credentials: VercelSandboxTokenCredentials;
    };

export interface VercelSandboxIdentityCleanupResult {
  deletedCount: number;
  deletedSandboxNames: string[];
  expiresBefore: string;
  inspectedCount: number;
  retentionDays: number;
  skippedCount: number;
}

export interface CleanupExpiredVercelSandboxIdentitiesInput {
  env?: VercelSandboxEnv;
  now?: Date;
  retentionDays?: number;
}

function getVercelSandboxCleanupAuth(
  env: VercelSandboxEnv
): VercelSandboxCleanupAuth {
  const setupState = getVercelSandboxSetupState(env);

  if (!setupState.isReady) {
    throw new Error(setupState.issues.join(" "));
  }

  if (setupState.authMode === "token") {
    return {
      authMode: "token",
      credentials: getVercelSandboxTokenCredentials(env),
    };
  }

  return {
    authMode: "oidc",
  };
}

function getVercelSandboxCleanupTags(retentionDays: number) {
  return {
    app: VERCEL_SANDBOX_DEMO_APP_TAG,
    retention: `${retentionDays}d`,
  };
}

function normalizeTimestamp(value: Date | number | string | undefined) {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  return null;
}

function getSandboxLastTouchedAt(sandbox: ListedVercelSandboxIdentity) {
  return (
    normalizeTimestamp(sandbox.updatedAt) ??
    normalizeTimestamp(sandbox.createdAt)
  );
}

function hasVercelSandboxCleanupTags(
  sandbox: ListedVercelSandboxIdentity,
  retentionDays: number
) {
  const expectedTags = getVercelSandboxCleanupTags(retentionDays);

  return (
    sandbox.tags?.app === expectedTags.app &&
    sandbox.tags.retention === expectedTags.retention
  );
}

async function listVercelSandboxIdentities(
  auth: VercelSandboxCleanupAuth,
  retentionDays: number
) {
  const tags = getVercelSandboxCleanupTags(retentionDays);
  const result =
    auth.authMode === "token"
      ? await Sandbox.list({
          ...auth.credentials,
          tags,
        })
      : await Sandbox.list({
          tags,
        });

  return result.toArray();
}

async function deleteVercelSandboxIdentity(
  auth: VercelSandboxCleanupAuth,
  name: string
) {
  const sandbox =
    auth.authMode === "token"
      ? await Sandbox.get({
          ...auth.credentials,
          name,
          resume: false,
        })
      : await Sandbox.get({
          name,
          resume: false,
        });

  await sandbox.delete();
}

export async function cleanupExpiredVercelSandboxIdentities(
  input: CleanupExpiredVercelSandboxIdentitiesInput = {}
): Promise<VercelSandboxIdentityCleanupResult> {
  const env = input.env ?? appEnv;
  const now = input.now ?? new Date();
  const retentionDays =
    input.retentionDays ?? vercelSandboxCleanupRetentionDays;
  const expiresBefore = new Date(
    now.getTime() - retentionDays * millisecondsPerDay
  );
  const auth = getVercelSandboxCleanupAuth(env);
  const sandboxes = await listVercelSandboxIdentities(auth, retentionDays);
  const deletedSandboxNames: string[] = [];

  for (const sandbox of sandboxes) {
    if (!hasVercelSandboxCleanupTags(sandbox, retentionDays)) {
      continue;
    }

    const lastTouchedAt = getSandboxLastTouchedAt(sandbox);

    if (lastTouchedAt === null || lastTouchedAt >= expiresBefore.getTime()) {
      continue;
    }

    await deleteVercelSandboxIdentity(auth, sandbox.name);
    deletedSandboxNames.push(sandbox.name);
  }

  return {
    deletedCount: deletedSandboxNames.length,
    deletedSandboxNames,
    expiresBefore: expiresBefore.toISOString(),
    inspectedCount: sandboxes.length,
    retentionDays,
    skippedCount: sandboxes.length - deletedSandboxNames.length,
  };
}
