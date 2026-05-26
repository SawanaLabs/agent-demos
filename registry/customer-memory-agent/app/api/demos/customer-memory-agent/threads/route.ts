import { getCustomerMemoryAgentEnv } from "@/lib/customer-memory-agent/env";
import { handleCustomerMemoryThreadCreateRequest } from "@/lib/customer-memory-agent/session-runtime";
import {
  buildCustomerMemoryVisitorCookie,
  getOrCreateCustomerMemoryVisitorId,
} from "@/lib/customer-memory-agent/viewer-context";

export async function POST(request: Request) {
  const visitor = getOrCreateCustomerMemoryVisitorId(request);
  const response = await handleCustomerMemoryThreadCreateRequest(
    request,
    {
      isReadonly: false,
      visitorId: visitor.visitorId,
    },
    getCustomerMemoryAgentEnv(),
    {}
  );

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "Set-Cookie",
      buildCustomerMemoryVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
