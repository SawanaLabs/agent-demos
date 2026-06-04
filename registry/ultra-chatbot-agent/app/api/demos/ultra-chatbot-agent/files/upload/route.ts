import { handleUltraChatbotAgentFileUploadRequest } from "@/lib/ultra-chatbot-agent/server/upload";
import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";

export async function POST(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (ownedRequest, viewer) =>
      handleUltraChatbotAgentFileUploadRequest(ownedRequest, {
        visitorId: viewer.visitorId,
      })
  );
}
