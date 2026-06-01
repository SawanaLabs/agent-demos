import { handleUltraChatbotAgentVisitorRequest } from "@/features/ultra-chatbot-agent/server/viewer-context";
import { handleUltraChatbotAgentVisibilityPatchRequest } from "@/features/ultra-chatbot-agent/server/visibility";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentVisibilityPatchRequest(request, {
        chatId: id,
        visitorId: visitor.visitorId,
      })
  );
}
