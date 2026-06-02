import { env as appEnv } from "@/env";
import {
  getCronSecret,
  getCronSecretError,
} from "@/features/shared/cron/server/env";
import {
  cleanupExpiredSiteUsageEvents,
  siteUsageCleanupCronScheduleUtc,
} from "@/features/site-usage-gate/server/cleanup";

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
        error: "Unauthorized site-usage cleanup request.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await cleanupExpiredSiteUsageEvents();

    return Response.json({
      ...result,
      scheduleUtc: siteUsageCleanupCronScheduleUtc,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Site-usage cleanup failed.",
      },
      { status: 500 }
    );
  }
}
