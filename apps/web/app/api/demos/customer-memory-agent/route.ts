import { handleCustomerMemoryChatRequest } from "@/features/customer-memory-agent/server/runtime";
import {
  buildCustomerMemoryVisitorCookie,
  getOrCreateCustomerMemoryVisitorId,
} from "@/features/customer-memory-agent/server/viewer-context";

export const maxDuration = 30;

export async function POST(request: Request) {
  const visitor = getOrCreateCustomerMemoryVisitorId(request);
  const response = await handleCustomerMemoryChatRequest(
    request,
    process.env,
    undefined,
    {
      isReadonly: false,
      visitorId: visitor.visitorId,
    }
  );

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "Set-Cookie",
      buildCustomerMemoryVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
