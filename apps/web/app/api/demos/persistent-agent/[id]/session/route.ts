import { handlePersistentAgentSessionRequest } from "@/features/persistent-agent/server/runtime";
import { handlePersistentAgentVisitorRequest } from "@/features/persistent-agent/server/viewer-context";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handlePersistentAgentVisitorRequest(
    request,
    async (_request, visitor) =>
      handlePersistentAgentSessionRequest(id, {
        visitorId: visitor.visitorId,
      })
  );
}
