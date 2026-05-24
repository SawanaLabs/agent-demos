import { env as appEnv } from "@/env";

export interface CronEnv {
  CRON_SECRET?: string;
}

export function getCronSecretError() {
  return "CRON_SECRET is missing. Customer-memory cleanup cron requires an authenticated secret.";
}

export function getCronSecret(env: CronEnv = appEnv) {
  if (!env.CRON_SECRET) {
    throw new Error(getCronSecretError());
  }

  return env.CRON_SECRET;
}
