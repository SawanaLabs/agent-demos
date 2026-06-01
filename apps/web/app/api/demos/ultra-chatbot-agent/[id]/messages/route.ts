import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";
import { handleUltraChatbotAgentMessageEditRequest } from "@/features/ultra-chatbot-agent/server/message-edit";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export const PATCH = withSiteUsageGate<RouteContext>(
  {
    action: "edit_message",
    demoSlug: "ultra-chatbot-agent",
  },
  async (request, context) => {
    const { id } = await context.params;
    const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
    const response = await handleUltraChatbotAgentMessageEditRequest(request, {
      chatId: id,
      visitorId: visitor.visitorId,
    });

    if (visitor.shouldSetCookie) {
      response.headers.append(
        "set-cookie",
        buildUltraChatbotAgentVisitorCookie(visitor.visitorId)
      );
    }

    return response;
  }
);
