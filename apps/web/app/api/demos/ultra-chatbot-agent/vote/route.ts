import {
  handleUltraChatbotAgentVoteListRequest,
  handleUltraChatbotAgentVotePatchRequest,
} from "@/features/ultra-chatbot-agent/server/votes";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function GET(request: Request) {
  const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentVoteListRequest(request, {
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

export async function PATCH(request: Request) {
  const visitor = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentVotePatchRequest(request, {
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
