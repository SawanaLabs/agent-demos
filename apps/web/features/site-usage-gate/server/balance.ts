import { type ResolvedSiteUsagePolicy, resolveSiteUsagePolicy } from "./policy";
import type { SiteUsageGateStore } from "./route-wrapper";

export interface CreditBalance {
  allowanceUnits: number;
  remainingUnits: number;
  resetAt: string;
  scope: ResolvedSiteUsagePolicy["scope"];
  usedUnits: number;
  windowSeconds: number;
}

export function creditBalance(
  policy: ResolvedSiteUsagePolicy,
  events: Array<{ createdAt: Date }>
): CreditBalance {
  const first = events.reduce<Date | undefined>(
    (oldest, event) =>
      !oldest || event.createdAt < oldest ? event.createdAt : oldest,
    undefined
  );
  return {
    allowanceUnits: policy.allowanceUnits,
    remainingUnits: Math.max(0, policy.allowanceUnits - events.length),
    usedUnits: events.length,
    scope: policy.scope,
    windowSeconds: policy.windowSeconds,
    resetAt: (policy.scope === "access_code" && first
      ? new Date(first.getTime() + policy.windowSeconds * 1000)
      : policy.resetAt
    ).toISOString(),
  };
}

export async function readCreditBalance(
  store: SiteUsageGateStore,
  visitorId: string,
  now: Date,
  freeVisitorId = visitorId
) {
  const visitor = await store.ensureVisitor({ now, visitorId });
  const policy = resolveSiteUsagePolicy({
    activeAccessCodePolicy: visitor.activeAccessCodePolicy,
    now,
  });
  const events = await store.listUsageEventsSince({
    now,
    since: policy.windowStartsAt,
    visitorId: visitor.activeAccessCodePolicy ? visitorId : freeVisitorId,
  });
  return creditBalance(policy, events);
}
