import {
  cleanupExpiredCustomerMemoryThreads,
  customerMemoryCleanupCronScheduleUtc,
} from "@/features/customer-memory-agent/server/cleanup";

function getCronSecretError() {
  return "CRON_SECRET is missing. Customer-memory cleanup cron requires an authenticated secret.";
}

function isAuthorizedCronRequest(request: Request, cronSecret: string) {
  const authorizationHeader = request.headers.get("authorization");

  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return Response.json(
      {
        error: getCronSecretError(),
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
        error: error instanceof Error ? error.message : "Customer-memory cleanup failed.",
      },
      { status: 500 }
    );
  }
}
