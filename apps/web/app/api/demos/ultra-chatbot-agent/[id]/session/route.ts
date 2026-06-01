import { handleUltraChatbotAgentSessionRequest } from "@/features/ultra-chatbot-agent/server/runtime";
import { handleUltraChatbotAgentVisitorRequest } from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentSessionRequest(id, {
        visitorId: visitor.visitorId,
      })
  );
}
