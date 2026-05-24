import { handleCustomerMemoryThreadCreateRequest } from "@/features/customer-memory-agent/server/session-runtime";
import {
  buildCustomerMemoryVisitorCookie,
  getOrCreateCustomerMemoryVisitorId,
} from "@/features/customer-memory-agent/server/viewer-context";

export async function POST(request: Request) {
  const visitor = getOrCreateCustomerMemoryVisitorId(request);
  const response = await handleCustomerMemoryThreadCreateRequest(
    request,
    process.env,
    {},
    {
      isReadonly: false,
      visitorId: visitor.visitorId,
    }
  );

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "Set-Cookie",
      buildCustomerMemoryVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
