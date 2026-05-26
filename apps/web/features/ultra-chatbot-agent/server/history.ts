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
        error:
          "Only one of starting_after or ending_before can be provided.",
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
  const result = await createUltraChatbotAgentChatStore().deleteAllChatsForVisitor(
    {
      visitorId: viewer.visitorId,
    }
  );

  return Response.json(result, { status: 200 });
}
