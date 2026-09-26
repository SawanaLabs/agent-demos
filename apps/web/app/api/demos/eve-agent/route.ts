import { handleEveAgentRequest } from "@/features/eve-agent/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "eve-agent",
  handler: ({ request }) => handleEveAgentRequest(request),
});
