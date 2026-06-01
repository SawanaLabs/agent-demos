import { createVisitorOwner } from "@/features/shared/visitor-owner/server/route-owner";
import type { CustomerMemoryProfile } from "../customer-profiles";

export const customerMemoryVisitorCookieName = "cm_visitor_id";
export const customerMemorySharedVisitorId = "demo-shared";
const customerMemoryVisitorOwner = createVisitorOwner({
  cookieName: customerMemoryVisitorCookieName,
  maxAgeSeconds: 60 * 60 * 24 * 30,
});

export interface CustomerMemoryViewerContext {
  isReadonly: boolean;
  visitorId: string;
}

export function getReadonlyCustomerMemoryError(
  customer: CustomerMemoryProfile
) {
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

export const handleCustomerMemoryVisitorRequest =
  customerMemoryVisitorOwner.handleOwnedRequest;
