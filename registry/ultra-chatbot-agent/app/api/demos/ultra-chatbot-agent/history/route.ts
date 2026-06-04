import {
  handleUltraChatbotAgentDeleteHistoryRequest,
  handleUltraChatbotAgentHistoryRequest,
} from "@/lib/ultra-chatbot-agent/server/history";
import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";

export async function GET(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentHistoryRequest(request, {
        visitorId: visitor.visitorId,
      })
  );
}

export async function DELETE(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentDeleteHistoryRequest({
        visitorId: visitor.visitorId,
      })
  );
}
