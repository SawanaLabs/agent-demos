import { getCustomerMemoryAgentEnv } from "@/features/customer-memory-agent/server/env";
import { handleCustomerMemoryManualCompactionRequest } from "@/features/customer-memory-agent/server/manual-compaction";
import { handleCustomerMemoryVisitorRequest } from "@/features/customer-memory-agent/server/viewer-context";
import { createVisitorOwnedMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const maxDuration = 30;

export const POST = createVisitorOwnedMeteredDemoRoute({
  action: "compact_context",
  demoSlug: "customer-memory-agent",
  handleVisitorRequest: handleCustomerMemoryVisitorRequest,
  handler: ({ request, visitor }) =>
    handleCustomerMemoryManualCompactionRequest(
      request,
      {
        isReadonly: false,
        visitorId: visitor.visitorId,
      },
      getCustomerMemoryAgentEnv(),
      undefined
    ),
});
