import {
  handleUltraChatbotAgentDeleteHistoryRequest,
  handleUltraChatbotAgentHistoryRequest,
} from "@/features/ultra-chatbot-agent/server/history";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function GET(request: Request) {
  const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentHistoryRequest(request, {
    visitorId: visitor.visitorId,
  });

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}

export async function DELETE(request: Request) {
  const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentDeleteHistoryRequest({
    visitorId: visitor.visitorId,
  });

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
