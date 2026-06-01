import { handleLoopAgentRequest } from "@/features/loop-agent/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "loop-agent",
  },
  async (request) => handleLoopAgentRequest(request)
);
