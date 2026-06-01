import {
  type SiteUsageGateAction,
  siteUsageLimitErrorCode as siteUsageLimitErrorCodeValue,
} from "../contract";
import {
  type ActiveAccessCodePolicy,
  checkSiteUsageLimit,
  resolveSiteUsagePolicy,
} from "./policy";
import {
  createSiteUsageVisitorId,
  resolveSiteUsageViewerContext,
  serializeSiteUsageVisitorCookie,
} from "./viewer-context";

export interface SiteUsageGateStore {
  createUsageEvent(input: {
    action: SiteUsageGateAction;
    createdAt: Date;
    demoSlug: string;
    visitorId: string;
  }): Promise<void>;
  ensureVisitor(input: { now: Date; visitorId: string }): Promise<{
    activeAccessCodePolicy: ActiveAccessCodePolicy | null;
  }>;
  listUsageEventsSince(input: {
    now: Date;
    since: Date;
    visitorId: string;
  }): Promise<Array<{ createdAt: Date }>>;
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
      const now = clock();
      const viewer = resolveSiteUsageViewerContext({
        createVisitorId,
        request,
      });
      const visitor = await store.ensureVisitor({
        now,
        visitorId: viewer.visitorId,
      });
      const policy = resolveSiteUsagePolicy({
        activeAccessCodePolicy: visitor.activeAccessCodePolicy,
        now,
      });
      const events = await store.listUsageEventsSince({
        now,
        since: policy.windowStartsAt,
        visitorId: viewer.visitorId,
      });
      const limitCheck = checkSiteUsageLimit({
        events,
        now,
        policy,
      });

      if (!limitCheck.allowed) {
        return Response.json(
          {
            action: options.action,
            code: siteUsageLimitErrorCodeValue,
            demoSlug: options.demoSlug,
            message: "Daily demo usage limit reached.",
            policy: {
              allowanceUnits: policy.allowanceUnits,
              remainingUnits: 0,
              scope: policy.scope,
              windowSeconds: policy.windowSeconds,
            },
            resetAt: limitCheck.resetAt.toISOString(),
            serverTime: now.toISOString(),
          },
          { status: 429 }
        );
      }

      const response = await handler();

      if (response.ok) {
        await store.createUsageEvent({
          action: options.action,
          createdAt: now,
          demoSlug: options.demoSlug,
          visitorId: viewer.visitorId,
        });
      }

      if (viewer.isNewVisitor) {
        response.headers.append(
          "set-cookie",
          serializeSiteUsageVisitorCookie(viewer.visitorId)
        );
      }

      return response;
    },
  };
}
