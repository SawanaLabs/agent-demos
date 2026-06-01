import { handlePersistentAgentChatRequest } from "@/features/persistent-agent/server/runtime";
import { handlePersistentAgentVisitorRequest } from "@/features/persistent-agent/server/viewer-context";
import { createVisitorOwnedMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const POST = createVisitorOwnedMeteredDemoRoute({
  action: "send_message",
  demoSlug: "persistent-agent",
  handleVisitorRequest: handlePersistentAgentVisitorRequest,
  handler: ({ request, visitor }) =>
    handlePersistentAgentChatRequest(request, {
      visitorId: visitor.visitorId,
    }),
});
