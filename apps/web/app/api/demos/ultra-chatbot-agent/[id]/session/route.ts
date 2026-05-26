import { handleUltraChatbotAgentSessionRequest } from "@/features/ultra-chatbot-agent/server/runtime";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentSessionRequest(id, {
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
