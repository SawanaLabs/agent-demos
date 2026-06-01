import { handleUltraChatbotAgentCapabilitySettingsPatchRequest } from "@/features/ultra-chatbot-agent/server/capability-settings";
import { handleUltraChatbotAgentVisitorRequest } from "@/features/ultra-chatbot-agent/server/viewer-context";

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
      handleUltraChatbotAgentCapabilitySettingsPatchRequest(request, {
        chatId: id,
        visitorId: visitor.visitorId,
      })
  );
}
