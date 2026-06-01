import { randomUUID } from "node:crypto";
import { createVisitorOwner } from "@/features/shared/visitor-owner/server/route-owner";

export const siteUsageVisitorCookieName = "site_visitor_id";

const maxVisitorCookieAgeSeconds = 365 * 24 * 60 * 60;
const visitorIdPattern = /^[A-Za-z0-9_-]{8,191}$/;
const siteUsageVisitorOwner = createVisitorOwner({
  cookieName: siteUsageVisitorCookieName,
  createVisitorId: createSiteUsageVisitorId,
  isValidVisitorId: (visitorId) => visitorIdPattern.test(visitorId),
  maxAgeSeconds: maxVisitorCookieAgeSeconds,
});

export interface SiteUsageViewerContext {
  isNewVisitor: boolean;
  visitorId: string;
}

export function createSiteUsageVisitorId() {
  return randomUUID();
}

export function resolveSiteUsageViewerContext({
  createVisitorId = createSiteUsageVisitorId,
  request,
}: {
  createVisitorId?: () => string;
  request: Request;
}): SiteUsageViewerContext {
  const owner = createVisitorOwner({
    cookieName: siteUsageVisitorCookieName,
    createVisitorId,
    isValidVisitorId: (visitorId) => visitorIdPattern.test(visitorId),
    maxAgeSeconds: maxVisitorCookieAgeSeconds,
  });
  const visitor = owner.resolveVisitor(request);

  return {
    isNewVisitor: visitor.isNewVisitor,
    visitorId: visitor.visitorId,
  };
}

export function appendSiteUsageVisitorCookie(
  response: Response,
  viewer: SiteUsageViewerContext
) {
  return siteUsageVisitorOwner.appendVisitorCookie(response, {
    isNewVisitor: viewer.isNewVisitor,
    shouldSetCookie: viewer.isNewVisitor,
    visitorId: viewer.visitorId,
  });
}
