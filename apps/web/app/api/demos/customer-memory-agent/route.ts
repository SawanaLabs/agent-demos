import { getCustomerMemoryAgentEnv } from "@/features/customer-memory-agent/server/env";
import { handleCustomerMemoryChatRequest } from "@/features/customer-memory-agent/server/runtime";
import {
  buildCustomerMemoryVisitorCookie,
  getOrCreateCustomerMemoryVisitorId,
} from "@/features/customer-memory-agent/server/viewer-context";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const maxDuration = 30;

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "customer-memory-agent",
  },
  async (request) => {
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
);
