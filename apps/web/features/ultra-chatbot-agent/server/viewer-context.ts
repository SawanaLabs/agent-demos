export const ultraChatbotAgentVisitorCookieName = "ua_visitor_id";

function parseCookieHeader(value: string | null) {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    value
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const separatorIndex = part.indexOf("=");

        if (separatorIndex === -1) {
          return [part, ""] as const;
        }

        return [
          decodeURIComponent(part.slice(0, separatorIndex)),
          decodeURIComponent(part.slice(separatorIndex + 1)),
        ] as const;
      })
  );
}

export function readUltraChatbotAgentVisitorIdFromCookieHeader(
  cookieHeader: string | null
) {
  const cookies = parseCookieHeader(cookieHeader);
  const visitorId = cookies[ultraChatbotAgentVisitorCookieName];

  return typeof visitorId === "string" && visitorId.trim().length > 0
    ? visitorId.trim()
    : null;
}

export function getOrCreateUltraChatbotAgentVisitorId(request: Request) {
  const visitorId = readUltraChatbotAgentVisitorIdFromCookieHeader(
    request.headers.get("cookie")
  );

  if (visitorId) {
    return {
      shouldSetCookie: false,
      visitorId,
    };
  }

  return {
    shouldSetCookie: true,
    visitorId: crypto.randomUUID(),
  };
}

export function buildUltraChatbotAgentVisitorCookie(visitorId: string) {
  return `${ultraChatbotAgentVisitorCookieName}=${encodeURIComponent(visitorId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}
