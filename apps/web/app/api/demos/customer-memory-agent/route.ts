import { getCustomerMemoryAgentEnv } from "@/features/customer-memory-agent/server/env";
import { handleCustomerMemoryChatRequest } from "@/features/customer-memory-agent/server/runtime";
import { handleCustomerMemoryVisitorRequest } from "@/features/customer-memory-agent/server/viewer-context";
import { createVisitorOwnedMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const maxDuration = 30;

export const POST = createVisitorOwnedMeteredDemoRoute({
  action: "send_message",
  demoSlug: "customer-memory-agent",
  handleVisitorRequest: handleCustomerMemoryVisitorRequest,
  handler: ({ request, visitor }) =>
    handleCustomerMemoryChatRequest(
      request,
      {
        isReadonly: false,
        visitorId: visitor.visitorId,
      },
      getCustomerMemoryAgentEnv(),
      undefined
    ),
});
