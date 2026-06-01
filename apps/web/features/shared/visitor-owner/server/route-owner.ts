export interface VisitorOwnerContext {
  isNewVisitor: boolean;
  shouldSetCookie: boolean;
  visitorId: string;
}

export interface VisitorOwner {
  appendVisitorCookie(
    response: Response,
    visitor: VisitorOwnerContext
  ): Response;
  buildVisitorCookie(visitorId: string): string;
  handleOwnedRequest(
    request: Request,
    handler: (
      request: Request,
      visitor: VisitorOwnerContext
    ) => Promise<Response>
  ): Promise<Response>;
  readVisitorIdFromCookieHeader(cookieHeader: string | null): string | null;
  resolveVisitor(request: Request): VisitorOwnerContext;
}

export function createVisitorOwner({
  cookieName,
  createVisitorId = () => crypto.randomUUID(),
  isValidVisitorId = (visitorId) => visitorId.trim().length > 0,
  maxAgeSeconds,
}: {
  cookieName: string;
  createVisitorId?: () => string;
  isValidVisitorId?: (visitorId: string) => boolean;
  maxAgeSeconds: number;
}): VisitorOwner {
  function readVisitorIdFromCookieHeader(cookieHeader: string | null) {
    const visitorId = getCookieValue(cookieHeader, cookieName);

    if (typeof visitorId === "string" && isValidVisitorId(visitorId)) {
      return visitorId.trim();
    }

    return null;
  }

  function resolveVisitor(request: Request): VisitorOwnerContext {
    const visitorId = readVisitorIdFromCookieHeader(
      request.headers.get("cookie")
    );

    if (visitorId) {
      return {
        isNewVisitor: false,
        shouldSetCookie: false,
        visitorId,
      };
    }

    return {
      isNewVisitor: true,
      shouldSetCookie: true,
      visitorId: createVisitorId(),
    };
  }

  function buildVisitorCookie(visitorId: string) {
    return [
      `${cookieName}=${encodeURIComponent(visitorId)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${maxAgeSeconds}`,
    ].join("; ");
  }

  function appendVisitorCookie(
    response: Response,
    visitor: VisitorOwnerContext
  ) {
    if (visitor.shouldSetCookie) {
      response.headers.append("set-cookie", buildVisitorCookie(visitor.visitorId));
    }

    return response;
  }

  async function handleOwnedRequest(
    request: Request,
    handler: (
      request: Request,
      visitor: VisitorOwnerContext
    ) => Promise<Response>
  ) {
    const visitor = resolveVisitor(request);
    const response = await handler(request, visitor);
    return appendVisitorCookie(response, visitor);
  }

  return {
    appendVisitorCookie,
    buildVisitorCookie,
    handleOwnedRequest,
    readVisitorIdFromCookieHeader,
    resolveVisitor,
  };
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const prefix = `${name}=`;
  const cookie = cookies.find((part) => part.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}
