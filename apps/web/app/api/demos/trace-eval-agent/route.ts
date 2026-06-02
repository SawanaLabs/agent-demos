import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
import { handleTraceEvalAgentRequest } from "@/features/trace-eval-agent/server/runtime";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "trace-eval-agent",
  handler: ({ request }) => handleTraceEvalAgentRequest(request),
});
