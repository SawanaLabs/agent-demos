import { getVercelBlobToken } from "@/features/shared/vercel-blob/server/env";
import {
  deleteUltraChatbotAgentBlobsForChat,
  deleteUltraChatbotAgentBlobsForVisitor,
} from "./blob-storage";
import { createUltraChatbotAgentChatStore } from "./chat-store";

function clampHistoryLimit(value: string | null) {
  const parsedValue = Number.parseInt(value || "10", 10);

  if (Number.isNaN(parsedValue)) {
    return 10;
  }

  return Math.min(Math.max(parsedValue, 1), 50);
}

export async function handleUltraChatbotAgentHistoryRequest(
  request: Request,
  viewer: { visitorId: string }
) {
  const url = new URL(request.url);
  const startingAfter = url.searchParams.get("starting_after");
  const endingBefore = url.searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return Response.json(
      {
        error: "Only one of starting_after or ending_before can be provided.",
      },
      { status: 400 }
    );
  }

  const result =
    await createUltraChatbotAgentChatStore().listChatsForVisitorPage({
      endingBefore,
      limit: clampHistoryLimit(url.searchParams.get("limit")),
      startingAfter,
      visitorId: viewer.visitorId,
    });

  return Response.json(result);
}

export async function handleUltraChatbotAgentDeleteHistoryRequest(viewer: {
  visitorId: string;
}) {
  const result =
    await createUltraChatbotAgentChatStore().deleteAllChatsForVisitor({
      visitorId: viewer.visitorId,
    });

  await deleteUltraChatbotAgentBlobsForVisitor({
    token: getVercelBlobToken(),
    visitorId: viewer.visitorId,
  });

  return Response.json(result, { status: 200 });
}

export async function handleUltraChatbotAgentDeleteChatRequest(
  chatId: string,
  viewer: {
    visitorId: string;
  }
) {
  if (chatId.trim().length === 0) {
    return Response.json(
      { error: "A valid chat id is required." },
      { status: 400 }
    );
  }

  const result = await createUltraChatbotAgentChatStore().deleteChatForVisitor({
    chatId,
    visitorId: viewer.visitorId,
  });

  if (result.deletedCount === 0) {
    return Response.json({ error: "Chat not found." }, { status: 404 });
  }

  await deleteUltraChatbotAgentBlobsForChat({
    chatId,
    token: getVercelBlobToken(),
    visitorId: viewer.visitorId,
  });

  return Response.json(result, { status: 200 });
}
