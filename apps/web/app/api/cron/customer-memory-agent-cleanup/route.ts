import { env as appEnv } from "@/env";

import {
  cleanupExpiredCustomerMemoryThreads,
  customerMemoryCleanupCronScheduleUtc,
} from "@/features/customer-memory-agent/server/cleanup";
import {
  getCronSecret,
  getCronSecretError,
} from "@/features/shared/cron/server/env";

function isAuthorizedCronRequest(request: Request, cronSecret: string) {
  const authorizationHeader = request.headers.get("authorization");

  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  let cronSecret: string;

  try {
    cronSecret = getCronSecret(appEnv);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : getCronSecretError(),
      },
      { status: 500 }
    );
  }

  if (!isAuthorizedCronRequest(request, cronSecret)) {
    return Response.json(
      {
        error: "Unauthorized customer-memory cleanup request.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await cleanupExpiredCustomerMemoryThreads();

    return Response.json({
      ...result,
      scheduleUtc: customerMemoryCleanupCronScheduleUtc,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Customer-memory cleanup failed.",
      },
      { status: 500 }
    );
  }
}
