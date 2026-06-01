import { handleFoundationChatRequest } from "@/features/foundation-chat/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "foundation-chat",
  },
  async (request) => handleFoundationChatRequest(request)
);
