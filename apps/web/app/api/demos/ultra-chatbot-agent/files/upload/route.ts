import { handleUltraChatbotAgentFileUploadRequest } from "@/features/ultra-chatbot-agent/server/upload";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function POST(request: Request) {
  const viewer = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentFileUploadRequest(request);

  if (viewer.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(viewer.visitorId)
    );
  }

  return response;
}
