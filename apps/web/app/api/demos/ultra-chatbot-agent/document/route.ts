import { handleUltraChatbotAgentDocumentRequest } from "@/features/ultra-chatbot-agent/server/documents";
import {
  buildUltraChatbotAgentVisitorCookie,
  getOrCreateUltraChatbotAgentVisitorId,
} from "@/features/ultra-chatbot-agent/server/viewer-context";

export async function GET(request: Request) {
  const viewer = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentDocumentRequest(
    request,
    {
      visitorId: viewer.visitorId,
    }
  );

  if (viewer.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(viewer.visitorId)
    );
  }

  return response;
}

export async function POST(request: Request) {
  const viewer = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentDocumentRequest(
    request,
    {
      visitorId: viewer.visitorId,
    }
  );

  if (viewer.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(viewer.visitorId)
    );
  }

  return response;
}

export async function DELETE(request: Request) {
  const viewer = getOrCreateUltraChatbotAgentVisitorId(request);
  const response = await handleUltraChatbotAgentDocumentRequest(
    request,
    {
      visitorId: viewer.visitorId,
    }
  );

  if (viewer.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildUltraChatbotAgentVisitorCookie(viewer.visitorId)
    );
  }

  return response;
}
