import { getCustomerMemoryAgentEnv } from "@/lib/customer-memory-agent/env";
import { handleCustomerMemorySessionRequest } from "@/lib/customer-memory-agent/session-runtime";
import {
  buildCustomerMemoryVisitorCookie,
  getOrCreateCustomerMemoryVisitorId,
} from "@/lib/customer-memory-agent/viewer-context";

export async function GET(request: Request) {
  const visitor = getOrCreateCustomerMemoryVisitorId(request);
  const response = await handleCustomerMemorySessionRequest(
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
