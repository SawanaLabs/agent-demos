import { handlePersistentAgentChatRequest } from "@/features/persistent-agent/server/runtime";
import {
  buildPersistentAgentVisitorCookie,
  getOrCreatePersistentAgentVisitorId,
} from "@/features/persistent-agent/server/viewer-context";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "persistent-agent",
  },
  async (request) => {
    const visitor = getOrCreatePersistentAgentVisitorId(request);
    const response = await handlePersistentAgentChatRequest(request, {
      visitorId: visitor.visitorId,
    });

    if (visitor.shouldSetCookie) {
      response.headers.append(
        "set-cookie",
        buildPersistentAgentVisitorCookie(visitor.visitorId)
      );
    }

    return response;
  }
);
