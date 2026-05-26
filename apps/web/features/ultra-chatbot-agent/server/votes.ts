import { z } from "zod";

import { createUltraChatbotAgentChatStore } from "./chat-store";

const ultraChatbotAgentVoteSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().min(1),
  type: z.enum(["up", "down", "clear"]),
});

function notFoundResponse() {
  return Response.json(
    {
      error: "Chat not found for this visitor.",
    },
    { status: 404 }
  );
}

export async function handleUltraChatbotAgentVoteListRequest(
  request: Request,
  viewer: { visitorId: string }
) {
  const chatId = new URL(request.url).searchParams.get("chatId");

  if (!chatId) {
    return Response.json(
      {
        error: "Parameter chatId is required.",
      },
      { status: 400 }
    );
  }

  const chatStore = createUltraChatbotAgentChatStore();
  const session = await chatStore.loadChatSession(chatId, viewer.visitorId);

  if (!session) {
    return notFoundResponse();
  }

  const votes = await chatStore.listVotesForChat({
    chatId,
    visitorId: viewer.visitorId,
  });

  return Response.json(votes, { status: 200 });
}

export async function handleUltraChatbotAgentVotePatchRequest(
  request: Request,
  viewer: { visitorId: string }
) {
  const parsedBody = ultraChatbotAgentVoteSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Parameters chatId, messageId, and type are required.",
      },
      { status: 400 }
    );
  }

  const chatStore = createUltraChatbotAgentChatStore();
  const session = await chatStore.loadChatSession(
    parsedBody.data.chatId,
    viewer.visitorId
  );

  if (!session) {
    return notFoundResponse();
  }

  if (parsedBody.data.type === "clear") {
    await chatStore.deleteVote({
      chatId: parsedBody.data.chatId,
      messageId: parsedBody.data.messageId,
      visitorId: viewer.visitorId,
    });
  } else {
    await chatStore.saveVote({
      chatId: parsedBody.data.chatId,
      isUpvoted: parsedBody.data.type === "up",
      messageId: parsedBody.data.messageId,
      visitorId: viewer.visitorId,
    });
  }

  return new Response("Message voted", { status: 200 });
}
