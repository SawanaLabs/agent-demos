import { createVisitorOwnedMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
import { handleUltraChatbotAgentMessageEditRequest } from "@/features/ultra-chatbot-agent/server/message-edit";
import { handleUltraChatbotAgentVisitorRequest } from "@/features/ultra-chatbot-agent/server/viewer-context";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export const PATCH = createVisitorOwnedMeteredDemoRoute<RouteContext>({
  action: "edit_message",
  demoSlug: "ultra-chatbot-agent",
  handleVisitorRequest: handleUltraChatbotAgentVisitorRequest,
  handler: async ({ context, request, visitor }) => {
    const { id } = await context.params;
    return handleUltraChatbotAgentMessageEditRequest(request, {
      chatId: id,
      visitorId: visitor.visitorId,
    });
  },
});
