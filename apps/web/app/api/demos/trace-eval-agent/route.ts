import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";
import { handleTraceEvalAgentRequest } from "@/features/trace-eval-agent/server/runtime";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "trace-eval-agent",
  },
  async (request) => handleTraceEvalAgentRequest(request)
);
