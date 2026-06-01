import { handleSandboxAgentRequest } from "@/features/sandbox-agent/server/request";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "sandbox-agent",
  },
  async (request) => handleSandboxAgentRequest(request)
);
