import { getCustomerMemoryAgentEnv } from "@/features/customer-memory-agent/server/env";
import { handleCustomerMemorySessionRequest } from "@/features/customer-memory-agent/server/session-runtime";
import { handleCustomerMemoryVisitorRequest } from "@/features/customer-memory-agent/server/viewer-context";

export async function GET(request: Request) {
  return handleCustomerMemoryVisitorRequest(
    request,
    async (_request, visitor) =>
      handleCustomerMemorySessionRequest(
        request,
        {
          isReadonly: false,
          visitorId: visitor.visitorId,
        },
        getCustomerMemoryAgentEnv(),
        {}
      )
  );
}
