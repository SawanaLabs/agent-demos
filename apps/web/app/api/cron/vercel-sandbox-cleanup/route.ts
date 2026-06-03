import { env as appEnv } from "@/env";
import {
  getCronSecret,
  getCronSecretError,
} from "@/features/shared/cron/server/env";
import {
  cleanupExpiredVercelSandboxIdentities,
  vercelSandboxCleanupCronScheduleUtc,
} from "@/features/shared/vercel-sandbox/server/cleanup";

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
        error: "Unauthorized vercel-sandbox cleanup request.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await cleanupExpiredVercelSandboxIdentities();

    return Response.json({
      ...result,
      scheduleUtc: vercelSandboxCleanupCronScheduleUtc,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Vercel Sandbox cleanup failed.",
      },
      { status: 500 }
    );
  }
}
