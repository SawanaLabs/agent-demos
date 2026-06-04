import { handleUltraChatbotAgentMessageEditRequest } from "@/lib/ultra-chatbot-agent/server/message-edit";
import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";

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
      handleUltraChatbotAgentMessageEditRequest(request, {
        chatId: id,
        visitorId: visitor.visitorId,
      })
  );
}
