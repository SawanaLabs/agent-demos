import { handlePersistentAgentChatRequest } from "@/features/persistent-agent/server/runtime";
import { handlePersistentAgentVisitorRequest } from "@/features/persistent-agent/server/viewer-context";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "persistent-agent",
  },
  (request) =>
    handlePersistentAgentVisitorRequest(request, async (_request, visitor) =>
      handlePersistentAgentChatRequest(request, {
        visitorId: visitor.visitorId,
      })
    )
);
