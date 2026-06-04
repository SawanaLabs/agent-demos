import { handleUltraChatbotAgentDeleteChatRequest } from "@/lib/ultra-chatbot-agent/server/history";
import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentDeleteChatRequest(id, {
        visitorId: visitor.visitorId,
      })
  );
}
