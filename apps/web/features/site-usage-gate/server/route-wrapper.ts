import {
  ResourceUsageDeniedError,
  withResourceUsage,
} from "@/features/shared/resource-usage/server/context";
import {
  type SiteUsageGateAction,
  type SiteUsageLimitPayload,
  siteUsageLimitErrorCode,
} from "../contract";
import { messageCreditCost, resourceCreditCosts } from "../pricing";
import type { CreditBalance } from "./balance";
import type { ActiveAccessCodePolicy } from "./policy";
import {
  appendSiteUsageVisitorCookie,
  createSiteUsageVisitorId,
  resolveSiteUsageViewerContext,
} from "./viewer-context";

export interface SiteUsageGateStore {
  ensureVisitor(input: {
    now: Date;
    visitorId: string;
  }): Promise<{ activeAccessCodePolicy: ActiveAccessCodePolicy | null }>;
  listUsageEventsSince(input: {
    now: Date;
    since: Date;
    visitorId: string;
  }): Promise<Array<{ createdAt: Date }>>;
  refundCredits(eventIds: string[]): Promise<void>;
  reserveCredits(input: {
    action: SiteUsageGateAction;
    createdAt: Date;
    demoSlug: string;
    visitorId: string;
    units: number;
  }): Promise<{ balance: CreditBalance; eventIds: string[]; allowed: boolean }>;
}

export interface SiteUsageGateOptions {
  action: SiteUsageGateAction;
  demoSlug: string;
}
export type MeteredRouteHandler = () => Promise<Response>;
export interface SiteUsageGate {
  handleMeteredRequest(
    request: Request,
    options: SiteUsageGateOptions,
    handler: MeteredRouteHandler
  ): Promise<Response>;
}

class CreditLimitError extends ResourceUsageDeniedError {
  readonly payload: SiteUsageLimitPayload;
  constructor(payload: SiteUsageLimitPayload) {
    super(
      `Not enough demo credits. This operation needs ${payload.requiredUnits} credits; ${payload.policy.remainingUnits} remain. Credits refresh at ${payload.resetAt}.`
    );
    this.payload = payload;
  }
}

export function createSiteUsageGate({
  clock = () => new Date(),
  createVisitorId = createSiteUsageVisitorId,
  store,
}: {
  clock?: () => Date;
  createVisitorId?: () => string;
  store: SiteUsageGateStore;
}): SiteUsageGate {
  return {
    async handleMeteredRequest(request, options, handler) {
      const viewer = resolveSiteUsageViewerContext({
        createVisitorId,
        request,
      });
      let denial: CreditLimitError | undefined;
      async function reserve(action: SiteUsageGateAction, units: number) {
        const now = clock();
        const reservation = await store.reserveCredits({
          ...options,
          action,
          units,
          visitorId: viewer.visitorId,
          createdAt: now,
        });
        if (!reservation.allowed) {
          denial = new CreditLimitError({
            action,
            code: siteUsageLimitErrorCode,
            demoSlug: options.demoSlug,
            message: "Not enough demo credits.",
            requiredUnits: units,
            policy: reservation.balance,
            resetAt: reservation.balance.resetAt,
            serverTime: now.toISOString(),
          });
          throw denial;
        }
        return reservation.eventIds;
      }
      let baseEventIds: string[] = [];
      let response: Response;
      try {
        baseEventIds = await reserve(options.action, messageCreditCost);
        response = await withResourceUsage(async (operation, count = 1) => {
          await reserve(operation, resourceCreditCosts[operation] * count);
        }, handler);
      } catch (error) {
        await store.refundCredits(baseEventIds);
        if (!denial) {
          throw error;
        }
        return appendSiteUsageVisitorCookie(
          creditDenialResponse(denial, baseEventIds.length),
          viewer
        );
      }
      if (!response.ok) {
        await store.refundCredits(baseEventIds);
        if (denial) {
          response = creditDenialResponse(denial, baseEventIds.length);
        }
      }
      return appendSiteUsageVisitorCookie(response, viewer);
    },
  };
}

function creditDenialResponse(error: CreditLimitError, refundedUnits: number) {
  const payload = error.payload;
  return Response.json(
    {
      ...payload,
      requiredUnits: (payload.requiredUnits ?? 0) + refundedUnits,
      policy: {
        ...payload.policy,
        remainingUnits: Math.min(
          payload.policy.allowanceUnits,
          payload.policy.remainingUnits + refundedUnits
        ),
      },
    },
    { status: 429 }
  );
}
