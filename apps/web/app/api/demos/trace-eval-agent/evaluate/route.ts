import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
import { handleTraceEvalAgentEvaluationRequest } from "@/features/trace-eval-agent/server/evaluation";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "evaluate",
  demoSlug: "trace-eval-agent",
  handler: ({ request }) => handleTraceEvalAgentEvaluationRequest(request),
});
