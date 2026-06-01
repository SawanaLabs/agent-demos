import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";
import { handleStreamingChatShellRequest } from "@/features/streaming-chat-shell/server/runtime";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "streaming-chat-shell",
  },
  async (request) => handleStreamingChatShellRequest(request)
);
