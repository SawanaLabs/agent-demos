import { handleMultimodalChatbotRequest } from "@/features/multimodal-chatbot/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "multimodal-chatbot",
  handler: ({ request }) => handleMultimodalChatbotRequest(request),
});
