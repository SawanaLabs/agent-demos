import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";
import { handleUltraChatbotAgentChatRequest } from "@/features/ultra-chatbot-agent/server/runtime";
import { handleUltraChatbotAgentVisitorRequest } from "@/features/ultra-chatbot-agent/server/viewer-context";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "ultra-chatbot-agent",
  },
  (request) =>
    handleUltraChatbotAgentVisitorRequest(request, async (_request, visitor) =>
      handleUltraChatbotAgentChatRequest(request, {
        visitorId: visitor.visitorId,
      })
    )
);
