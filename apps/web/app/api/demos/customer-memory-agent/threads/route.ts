import { getCustomerMemoryAgentEnv } from "@/features/customer-memory-agent/server/env";
import { handleCustomerMemoryThreadCreateRequest } from "@/features/customer-memory-agent/server/session-runtime";
import { handleCustomerMemoryVisitorRequest } from "@/features/customer-memory-agent/server/viewer-context";

export async function POST(request: Request) {
  return handleCustomerMemoryVisitorRequest(
    request,
    async (_request, visitor) =>
      handleCustomerMemoryThreadCreateRequest(
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
