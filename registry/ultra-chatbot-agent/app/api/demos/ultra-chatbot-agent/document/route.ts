import { handleUltraChatbotAgentDocumentRequest } from "@/lib/ultra-chatbot-agent/server/documents";
import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";

export async function GET(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentDocumentRequest(request, {
        visitorId: visitor.visitorId,
      })
  );
}

export async function POST(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentDocumentRequest(request, {
        visitorId: visitor.visitorId,
      })
  );
}

export async function DELETE(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentDocumentRequest(request, {
        visitorId: visitor.visitorId,
      })
  );
}
