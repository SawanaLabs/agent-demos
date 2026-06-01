import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";
import { handleUltraChatbotAgentChatRequest } from "@/features/ultra-chatbot-agent/server/runtime";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "ultra-chatbot-agent",
  },
  async (request) => {
    const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
    const response = await handleUltraChatbotAgentChatRequest(request, {
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
