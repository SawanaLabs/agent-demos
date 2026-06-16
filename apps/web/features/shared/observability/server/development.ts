export interface DevelopmentObservabilityEnv {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  VERCEL_TARGET_ENV?: string;
}

export function isDevelopmentObservabilityAvailable(
  env: DevelopmentObservabilityEnv
): boolean {
  if (env.NODE_ENV !== "development") {
    return false;
  }

  if (env.VERCEL_ENV && env.VERCEL_ENV !== "development") {
    return false;
  }

  if (env.VERCEL_TARGET_ENV && env.VERCEL_TARGET_ENV !== "development") {
    return false;
  }

  return true;
}
