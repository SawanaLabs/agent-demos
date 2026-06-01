import { handleRagChatbotRequest } from "@/features/rag-chatbot/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";
export const maxDuration = 30;

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "rag-chatbot",
  },
  async (request) => handleRagChatbotRequest(request)
);
