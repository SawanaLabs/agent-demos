import { handleLangGraphAgentRequest } from "@/features/langgraph-agent/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "langgraph-agent",
  handler: ({ request }) => handleLangGraphAgentRequest(request),
});
