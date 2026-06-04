import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";
import {
  handleUltraChatbotAgentVoteListRequest,
  handleUltraChatbotAgentVotePatchRequest,
} from "@/lib/ultra-chatbot-agent/server/votes";

export async function GET(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentVoteListRequest(request, {
        visitorId: visitor.visitorId,
      })
  );
}

export async function PATCH(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentVotePatchRequest(request, {
        visitorId: visitor.visitorId,
      })
  );
}
