import { handleMultimodalChatbotRequest } from "@/features/multimodal-chatbot/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "multimodal-chatbot",
  },
  async (request) => handleMultimodalChatbotRequest(request)
);
