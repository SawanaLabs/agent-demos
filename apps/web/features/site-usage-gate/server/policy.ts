import type { SiteUsagePolicyScope } from "../contract";

const millisecondsPerSecond = 1000;
const secondsPerDay = 24 * 60 * 60;

export const defaultSiteUsageAllowanceUnits = 50;

export interface ActiveAccessCodePolicy {
  allowanceUnits: number;
  windowSeconds: number;
}

export interface ResolvedSiteUsagePolicy {
  allowanceUnits: number;
  resetAt: Date;
  scope: SiteUsagePolicyScope;
  windowSeconds: number;
  windowStartsAt: Date;
}

export function resolveSiteUsagePolicy({
  activeAccessCodePolicy,
  now,
}: {
  activeAccessCodePolicy: ActiveAccessCodePolicy | null;
  now: Date;
}): ResolvedSiteUsagePolicy {
  if (activeAccessCodePolicy) {
    return {
      allowanceUnits: activeAccessCodePolicy.allowanceUnits,
      resetAt: new Date(
        now.getTime() +
          activeAccessCodePolicy.windowSeconds * millisecondsPerSecond
      ),
      scope: "access_code",
      windowSeconds: activeAccessCodePolicy.windowSeconds,
      windowStartsAt: new Date(
        now.getTime() -
          activeAccessCodePolicy.windowSeconds * millisecondsPerSecond
      ),
    };
  }

  const windowStartsAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const resetAt = new Date(
    windowStartsAt.getTime() + secondsPerDay * millisecondsPerSecond
  );

  return {
    allowanceUnits: defaultSiteUsageAllowanceUnits,
    resetAt,
    scope: "default_daily",
    windowSeconds: secondsPerDay,
    windowStartsAt,
  };
}
