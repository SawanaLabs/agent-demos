import { handleMultiAgentExplorerRequest } from "@/features/multi-agent-explorer/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "multi-agent-explorer",
  handler: ({ request }) => handleMultiAgentExplorerRequest(request),
});
