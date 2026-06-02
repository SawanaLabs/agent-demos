import { handleRagChatbotRequest } from "@/features/rag-chatbot/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";
export const maxDuration = 30;

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "rag-chatbot",
  handler: ({ request }) => handleRagChatbotRequest(request),
});
