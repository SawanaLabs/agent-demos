import { handleUltraChatbotAgentVisibilityPatchRequest } from "@/features/ultra-chatbot-agent/server/visibility";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentVisibilityPatchRequest(
    request,
    {
      chatId: id,
      visitorId: visitor.visitorId,
    }
  );

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
