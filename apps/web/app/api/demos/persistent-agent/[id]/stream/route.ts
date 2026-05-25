import { handlePersistentAgentStreamResumeRequest } from "@/features/persistent-agent/server/runtime";
import {
  buildPersistentAgentVisitorCookie,
  getOrCreatePersistentAgentVisitorId,
} from "@/features/persistent-agent/server/viewer-context";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const visitor = getOrCreatePersistentAgentVisitorId(request);
  const response = await handlePersistentAgentStreamResumeRequest(id, {
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
