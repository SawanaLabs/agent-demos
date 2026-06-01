import { handleMcpAgentRequest } from "@/features/mcp-agent/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "mcp-agent",
  },
  async (request) => handleMcpAgentRequest(request)
);
