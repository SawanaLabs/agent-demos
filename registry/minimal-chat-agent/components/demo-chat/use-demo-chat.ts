"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { type ChatStatus, DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";

interface CreateDemoChatOptions {
  api: string;
}

interface UseDemoChatWithApiOptions extends CreateDemoChatOptions {
  createChat?: never;
}

interface UseDemoChatWithFactoryOptions<TMessage extends UIMessage> {
  api?: never;
  createChat: () => Chat<TMessage>;
}

type UseDemoChatOptions<TMessage extends UIMessage> =
  | UseDemoChatWithApiOptions
  | UseDemoChatWithFactoryOptions<TMessage>;

export function createDemoChat<TMessage extends UIMessage = UIMessage>({
  api,
}: CreateDemoChatOptions) {
  return new Chat<TMessage>({
    transport: new DefaultChatTransport({
      api,
    }),
  });
}

export function isDemoChatBusyStatus(status: ChatStatus) {
  return status === "submitted" || status === "streaming";
}

export function useDemoChat<TMessage extends UIMessage = UIMessage>(
  options: UseDemoChatOptions<TMessage>
) {
  const [chat] = useState(() => {
    if (options.createChat) {
      return options.createChat();
    }

    return createDemoChat<TMessage>({ api: options.api });
  });
  const controller = useChat({ chat });
  const hasMessages = controller.messages.length > 0;
  const isBusy = isDemoChatBusyStatus(controller.status);

  return {
    ...controller,
    chat,
    hasMessages,
    isBusy,
  };
}
