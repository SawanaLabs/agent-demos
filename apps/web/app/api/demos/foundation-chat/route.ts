import { handleFoundationChatRequest } from "@/features/foundation-chat/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "foundation-chat",
  handler: ({ request }) => handleFoundationChatRequest(request),
});
