import { handleSandboxAgentRequest } from "@/features/sandbox-agent/server/request";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "sandbox-agent",
  handler: ({ request }) => handleSandboxAgentRequest(request),
});
