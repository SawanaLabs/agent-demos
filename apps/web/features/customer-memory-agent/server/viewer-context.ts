import type { CustomerMemoryProfile } from "../customer-profiles";

export const customerMemoryVisitorCookieName = "cm_visitor_id";
export const customerMemorySharedVisitorId = "demo-shared";

export interface CustomerMemoryViewerContext {
  isReadonly: boolean;
  visitorId: string;
}

export function getReadonlyCustomerMemoryError(customer: CustomerMemoryProfile) {
  return `Customer-memory demo account "${customer.name}" is read-only. Switch to Demo Sandbox to create your own threads.`;
}

export function resolveCustomerMemoryViewerContext(input: {
  customer: CustomerMemoryProfile;
  visitorId: string;
}): CustomerMemoryViewerContext {
  if (input.customer.accessMode === "shared_readonly") {
    return {
      isReadonly: true,
      visitorId: customerMemorySharedVisitorId,
    };
  }

  return {
    isReadonly: false,
    visitorId: input.visitorId,
  };
}

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

export function readCustomerMemoryVisitorId(request: Request) {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const visitorId = cookies[customerMemoryVisitorCookieName];

  return typeof visitorId === "string" && visitorId.trim().length > 0
    ? visitorId.trim()
    : null;
}

export function getOrCreateCustomerMemoryVisitorId(request: Request) {
  const existingVisitorId = readCustomerMemoryVisitorId(request);

  if (existingVisitorId) {
    return {
      shouldSetCookie: false,
      visitorId: existingVisitorId,
    };
  }

  return {
    shouldSetCookie: true,
    visitorId: crypto.randomUUID(),
  };
}

export function buildCustomerMemoryVisitorCookie(visitorId: string) {
  return `${customerMemoryVisitorCookieName}=${encodeURIComponent(visitorId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}
