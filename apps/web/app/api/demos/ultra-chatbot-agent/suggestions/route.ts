import { handleUltraChatbotAgentSuggestionsRequest } from "@/features/ultra-chatbot-agent/server/suggestions";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function GET(request: Request) {
  const viewer = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentSuggestionsRequest(request, {
    visitorId: viewer.visitorId,
  });

  if (viewer.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(viewer.visitorId)
    );
  }

  return response;
}
