import { handleUltraChatbotAgentChatRequest } from "@/lib/ultra-chatbot-agent/server/runtime";
import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";

export async function POST(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
    handleUltraChatbotAgentChatRequest(request, {
      visitorId: visitor.visitorId,
      })
  );
}
