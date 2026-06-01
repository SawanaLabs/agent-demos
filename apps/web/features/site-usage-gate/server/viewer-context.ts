import { randomUUID } from "node:crypto";

export const siteUsageVisitorCookieName = "site_visitor_id";

const maxVisitorCookieAgeSeconds = 365 * 24 * 60 * 60;
const visitorIdPattern = /^[A-Za-z0-9_-]{8,191}$/;

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
  const cookieHeader = request.headers.get("cookie");
  const visitorId = getCookieValue(cookieHeader, siteUsageVisitorCookieName);

  if (visitorId && visitorIdPattern.test(visitorId)) {
    return {
      isNewVisitor: false,
      visitorId,
    };
  }

  return {
    isNewVisitor: true,
    visitorId: createVisitorId(),
  };
}

export function serializeSiteUsageVisitorCookie(visitorId: string) {
  const segments = [
    `${siteUsageVisitorCookieName}=${encodeURIComponent(visitorId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxVisitorCookieAgeSeconds}`,
  ];

  return segments.join("; ");
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const prefix = `${name}=`;
  const cookie = cookies.find((part) => part.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}
