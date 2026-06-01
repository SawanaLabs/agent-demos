import { createVisitorOwnedMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
import { handleUltraChatbotAgentChatRequest } from "@/features/ultra-chatbot-agent/server/runtime";
import { handleUltraChatbotAgentVisitorRequest } from "@/features/ultra-chatbot-agent/server/viewer-context";

export const POST = createVisitorOwnedMeteredDemoRoute({
  action: "send_message",
  demoSlug: "ultra-chatbot-agent",
  handleVisitorRequest: handleUltraChatbotAgentVisitorRequest,
  handler: ({ request, visitor }) =>
    handleUltraChatbotAgentChatRequest(request, {
      visitorId: visitor.visitorId,
    }),
});
