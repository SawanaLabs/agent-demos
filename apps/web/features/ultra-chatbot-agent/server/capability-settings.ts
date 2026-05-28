import { z } from "zod";

import { createUltraChatbotAgentChatStore } from "./chat-store";

const ultraChatbotAgentCapabilitySettingsSchema = z.object({
  sandboxEnabled: z.boolean(),
});

export async function handleUltraChatbotAgentCapabilitySettingsPatchRequest(
  request: Request,
  viewer: { chatId: string; visitorId: string }
) {
  const parsedBody = ultraChatbotAgentCapabilitySettingsSchema.safeParse(
    await request.json()
  );

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "A valid capability settings payload is required.",
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

  const capabilities = await chatStore.setChatCapabilities({
    capabilities: {
      sandboxEnabled: parsedBody.data.sandboxEnabled,
    },
    chatId: viewer.chatId,
    visitorId: viewer.visitorId,
  });

  return Response.json(capabilities, { status: 200 });
}
