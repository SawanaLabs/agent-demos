import { handlePersistentAgentChatRequest } from "@/lib/persistent-agent/server/runtime";
import {
  buildPersistentAgentVisitorCookie,
  getOrCreatePersistentAgentVisitorId,
} from "@/lib/persistent-agent/server/viewer-context";

export async function POST(request: Request) {
  const visitor = getOrCreatePersistentAgentVisitorId(request);
  const response = await handlePersistentAgentChatRequest(request, {
    visitorId: visitor.visitorId,
  });

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "set-cookie",
      buildPersistentAgentVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
