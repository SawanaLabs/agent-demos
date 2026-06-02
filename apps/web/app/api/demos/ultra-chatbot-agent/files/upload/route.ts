import { handleUltraChatbotAgentFileUploadRequest } from "@/features/ultra-chatbot-agent/server/upload";
import { handleUltraChatbotAgentVisitorRequest } from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function POST(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(request, async () =>
    handleUltraChatbotAgentFileUploadRequest(request)
  );
}
