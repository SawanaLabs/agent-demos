"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";

export function useMultimodalChatbot() {
  const [chat] = useState(
    () =>
      new Chat<UIMessage>({
        transport: new DefaultChatTransport({
          api: "/api/demos/multimodal-chatbot",
        }),
      })
  );
  const controller = useChat({ chat });
  const hasMessages = controller.messages.length > 0;
  const isBusy =
    controller.status === "submitted" || controller.status === "streaming";

  return {
    ...controller,
    hasMessages,
    isBusy,
  };
}
