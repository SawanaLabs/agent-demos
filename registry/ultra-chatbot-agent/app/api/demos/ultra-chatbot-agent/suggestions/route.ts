import { handleUltraChatbotAgentSuggestionsRequest } from "@/lib/ultra-chatbot-agent/server/suggestions";
import { handleUltraChatbotAgentVisitorRequest } from "@/lib/ultra-chatbot-agent/server/viewer-context";

export async function GET(request: Request) {
  return handleUltraChatbotAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handleUltraChatbotAgentSuggestionsRequest(request, {
        visitorId: visitor.visitorId,
      })
  );
}
