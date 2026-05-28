"use client";

import { type Chat, useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useState } from "react";

interface UseCustomerMemoryChatWithFactoryOptions<TMessage extends UIMessage> {
  createChat: () => Chat<TMessage>;
}

export function useCustomerMemoryChat<TMessage extends UIMessage = UIMessage>(
  options: UseCustomerMemoryChatWithFactoryOptions<TMessage>
) {
  const [chat] = useState(() => options.createChat());
  const controller = useChat({ chat });
  const hasMessages = controller.messages.length > 0;
  const isBusy =
    controller.status === "submitted" || controller.status === "streaming";

  return {
    ...controller,
    chat,
    hasMessages,
    isBusy,
  };
}
