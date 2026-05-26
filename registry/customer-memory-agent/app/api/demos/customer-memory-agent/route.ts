import { getCustomerMemoryAgentEnv } from "@/lib/customer-memory-agent/env";
import { handleCustomerMemoryChatRequest } from "@/lib/customer-memory-agent/runtime";
import {
  buildCustomerMemoryVisitorCookie,
  getOrCreateCustomerMemoryVisitorId,
} from "@/lib/customer-memory-agent/viewer-context";

export const maxDuration = 30;

export async function POST(request: Request) {
  const visitor = getOrCreateCustomerMemoryVisitorId(request);
  const response = await handleCustomerMemoryChatRequest(
    request,
    {
      isReadonly: false,
      visitorId: visitor.visitorId,
    },
    getCustomerMemoryAgentEnv(),
    undefined
  );

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "Set-Cookie",
      buildCustomerMemoryVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
