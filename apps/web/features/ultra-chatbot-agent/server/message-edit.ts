import type { UIMessage } from "ai";
import { z } from "zod";

import { createUltraChatbotAgentChatStore } from "./chat-store";

const ultraChatbotAgentMessageEditSchema = z.object({
  messageId: z.string().min(1),
  text: z.string().trim().min(1),
});

function buildEditedUserMessage(message: UIMessage, text: string) {
  const preservedParts = message.parts.filter((part) => part.type !== "text");

  return {
    ...message,
    parts: [
      ...preservedParts,
      {
        text,
        type: "text" as const,
      },
    ],
  } satisfies UIMessage;
}

export async function handleUltraChatbotAgentMessageEditRequest(
  request: Request,
  viewer: { chatId: string; visitorId: string }
) {
  const parsedBody = ultraChatbotAgentMessageEditSchema.safeParse(
    await request.json()
  );

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "A valid messageId and edited text are required.",
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

  const targetMessage = session.messages.find(
    (message) => message.id === parsedBody.data.messageId
  );

  if (!targetMessage || targetMessage.role !== "user") {
    return Response.json(
      {
        error: "Only persisted user messages can be edited.",
      },
      { status: 400 }
    );
  }

  await chatStore.saveIncomingUserMessage({
    chatId: viewer.chatId,
    message: buildEditedUserMessage(targetMessage, parsedBody.data.text),
    selectedChatModel: session.chat.selectedChatModel,
    selectedVisibilityType: session.chat.visibility,
    visitorId: viewer.visitorId,
  });

  const result = await chatStore.deleteMessagesAfterMessage({
    chatId: viewer.chatId,
    messageId: parsedBody.data.messageId,
    visitorId: viewer.visitorId,
  });

  return Response.json(result, { status: 200 });
}
