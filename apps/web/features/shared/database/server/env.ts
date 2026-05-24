import { env as appEnv } from "@/env";

export interface DatabaseEnv {
  DATABASE_URL?: string;
}

export interface DatabaseSetupState {
  isReady: boolean;
  issues: string[];
}

export function getDatabaseUrl(env: DatabaseEnv = appEnv) {
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add it to apps/web/.env.local using the contract in apps/web/.env.example."
    );
  }

  return env.DATABASE_URL;
}

export function getDatabaseSetupState(
  env: DatabaseEnv = appEnv
): DatabaseSetupState {
  const issues = env.DATABASE_URL
    ? []
    : [
        "DATABASE_URL is missing. Add it to apps/web/.env.local using the contract in apps/web/.env.example.",
      ];

  return {
    isReady: issues.length === 0,
    issues,
  };
}
