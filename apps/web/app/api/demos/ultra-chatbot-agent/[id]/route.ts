import { handleUltraChatbotAgentDeleteChatRequest } from "@/features/ultra-chatbot-agent/server/history";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentDeleteChatRequest(id, {
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
