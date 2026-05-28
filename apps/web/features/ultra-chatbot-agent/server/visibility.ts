import { z } from "zod";

import { createUltraChatbotAgentChatStore } from "./chat-store";

const ultraChatbotAgentVisibilitySchema = z.object({
  visibility: z.enum(["private", "public"]),
});

export async function handleUltraChatbotAgentVisibilityPatchRequest(
  request: Request,
  viewer: { chatId: string; visitorId: string }
) {
  const parsedBody = ultraChatbotAgentVisibilitySchema.safeParse(
    await request.json()
  );

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "A valid visibility value is required.",
      },
      { status: 400 }
    );
  }

  const chatStore = createUltraChatbotAgentChatStore();
  const session = await chatStore.loadChatSession(
    viewer.chatId,
    viewer.visitorId
  );

  if (!session) {
    return Response.json(
      {
        error: "Chat not found for this visitor.",
      },
      { status: 404 }
    );
  }

  const updatedChat = await chatStore.setChatVisibility({
    chatId: viewer.chatId,
    visibility: parsedBody.data.visibility,
    visitorId: viewer.visitorId,
  });

  return Response.json(updatedChat, { status: 200 });
}
