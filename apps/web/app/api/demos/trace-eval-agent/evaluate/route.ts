import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";
import { handleTraceEvalAgentEvaluationRequest } from "@/features/trace-eval-agent/server/evaluation";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "evaluate",
    demoSlug: "trace-eval-agent",
  },
  async (request) => handleTraceEvalAgentEvaluationRequest(request)
);
