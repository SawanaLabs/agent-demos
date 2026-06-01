"use client";

import type { Chat } from "@ai-sdk/react";
import type { UIMessage } from "ai";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

interface UseCustomerMemoryChatOptions<TMessage extends UIMessage> {
  createChat: () => Chat<TMessage>;
}

export function useCustomerMemoryChat<TMessage extends UIMessage = UIMessage>(
  options: UseCustomerMemoryChatOptions<TMessage>
) {
  return useDemoChat(options);
}
