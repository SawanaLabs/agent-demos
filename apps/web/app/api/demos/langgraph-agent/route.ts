import { handleLangGraphAgentRequest } from "@/features/langgraph-agent/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "langgraph-agent",
  },
  async (request) => handleLangGraphAgentRequest(request)
);
