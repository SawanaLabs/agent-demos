import type { SiteUsagePolicyScope } from "../contract";

const millisecondsPerSecond = 1000;
const secondsPerDay = 24 * 60 * 60;

export const defaultSiteUsageAllowanceUnits = 10;

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

export interface SiteUsageEventSnapshot {
  createdAt: Date;
}

export type SiteUsageLimitCheck =
  | {
      allowed: true;
      remainingUnits: number;
    }
  | {
      allowed: false;
      resetAt: Date;
      remainingUnits: 0;
    };

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

export function checkSiteUsageLimit({
  events,
  now,
  policy,
}: {
  events: SiteUsageEventSnapshot[];
  now: Date;
  policy: ResolvedSiteUsagePolicy;
}): SiteUsageLimitCheck {
  if (events.length < policy.allowanceUnits) {
    return {
      allowed: true,
      remainingUnits: policy.allowanceUnits - events.length,
    };
  }

  if (policy.scope === "access_code") {
    const [oldestEvent] = [...events].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
    );
    const resetAt = oldestEvent
      ? new Date(
          oldestEvent.createdAt.getTime() +
            policy.windowSeconds * millisecondsPerSecond
        )
      : policy.resetAt;

    return {
      allowed: false,
      remainingUnits: 0,
      resetAt: resetAt > now ? resetAt : now,
    };
  }

  return {
    allowed: false,
    remainingUnits: 0,
    resetAt: policy.resetAt,
  };
}
