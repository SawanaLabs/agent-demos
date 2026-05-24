import { env as appEnv } from "@/env";

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
    {
      isReadonly: false,
      visitorId: visitor.visitorId,
    },
    appEnv,
    undefined
  );

  if (visitor.shouldSetCookie) {
    response.headers.append(
      "Set-Cookie",
      buildCustomerMemoryVisitorCookie(visitor.visitorId)
    );
  }

  return response;
}
