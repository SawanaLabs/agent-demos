import { handleMinimalChatAgentRequest } from "@/features/minimal-chat-agent/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "minimal-chat-agent",
  handler: ({ request }) => handleMinimalChatAgentRequest(request),
});
