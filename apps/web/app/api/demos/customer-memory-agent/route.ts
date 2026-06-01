import { getCustomerMemoryAgentEnv } from "@/features/customer-memory-agent/server/env";
import { handleCustomerMemoryChatRequest } from "@/features/customer-memory-agent/server/runtime";
import { handleCustomerMemoryVisitorRequest } from "@/features/customer-memory-agent/server/viewer-context";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const maxDuration = 30;

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "customer-memory-agent",
  },
  (request) =>
    handleCustomerMemoryVisitorRequest(request, async (_request, visitor) =>
      handleCustomerMemoryChatRequest(
        request,
        {
          isReadonly: false,
          visitorId: visitor.visitorId,
        },
        getCustomerMemoryAgentEnv(),
        undefined
      )
    )
);
