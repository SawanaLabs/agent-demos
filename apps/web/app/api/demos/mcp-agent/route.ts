import { handleMcpAgentRequest } from "@/features/mcp-agent/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "mcp-agent",
  handler: ({ request }) => handleMcpAgentRequest(request),
});
