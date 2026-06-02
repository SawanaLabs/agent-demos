import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
import { handleStreamingChatShellRequest } from "@/features/streaming-chat-shell/server/runtime";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "streaming-chat-shell",
  handler: ({ request }) => handleStreamingChatShellRequest(request),
});
