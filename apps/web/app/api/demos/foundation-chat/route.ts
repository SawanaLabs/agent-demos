import type { UIMessage } from "ai";

import { streamFoundationChat } from "@/features/foundation-chat/server/stream-foundation-chat";
import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const setup = getAiGatewaySetupState();

  if (!setup.isReady) {
    return Response.json(
      {
        error: setup.issues.join(" "),
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as { messages?: UIMessage[] };

  if (!Array.isArray(body.messages)) {
    return Response.json(
      {
        error: 'Expected a JSON body with a "messages" array.',
      },
      { status: 400 }
    );
  }

  return streamFoundationChat(body.messages);
}
