import { env as appEnv } from "@/env";

export interface VercelBlobEnv {
  BLOB_READ_WRITE_TOKEN?: string;
}

export interface VercelBlobSetupState {
  isReady: boolean;
  issues: string[];
}

export function getVercelBlobToken(env: VercelBlobEnv = appEnv) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Add it to apps/web/.env.local using the project Vercel Blob integration."
    );
  }

  return env.BLOB_READ_WRITE_TOKEN;
}

export function getVercelBlobSetupState(
  env: VercelBlobEnv = appEnv
): VercelBlobSetupState {
  const issues = env.BLOB_READ_WRITE_TOKEN
    ? []
    : [
        "BLOB_READ_WRITE_TOKEN is missing. Add it to apps/web/.env.local using the project Vercel Blob integration.",
      ];

  return {
    isReady: issues.length === 0,
    issues,
  };
}
