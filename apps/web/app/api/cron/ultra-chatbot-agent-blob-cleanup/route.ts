import { env as appEnv } from "@/env";
import {
  getCronSecret,
  getCronSecretError,
} from "@/features/shared/cron/server/env";
import {
  cleanupExpiredUltraChatbotAgentUploadBlobs,
  ultraChatbotAgentBlobCleanupCronScheduleUtc,
} from "@/features/ultra-chatbot-agent/server/blob-cleanup";

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
        error: "Unauthorized ultra-chatbot-agent blob cleanup request.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await cleanupExpiredUltraChatbotAgentUploadBlobs();

    return Response.json({
      ...result,
      scheduleUtc: ultraChatbotAgentBlobCleanupCronScheduleUtc,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ultra-chatbot-agent blob cleanup failed.",
      },
      { status: 500 }
    );
  }
}
