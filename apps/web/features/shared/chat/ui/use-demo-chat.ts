"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";

interface UseDemoChatWithApiOptions {
  api: string;
  createChat?: never;
}

interface UseDemoChatWithFactoryOptions<TMessage extends UIMessage> {
  api?: never;
  createChat: () => Chat<TMessage>;
}

type UseDemoChatOptions<TMessage extends UIMessage> =
  | UseDemoChatWithApiOptions
  | UseDemoChatWithFactoryOptions<TMessage>;

export function useDemoChat<TMessage extends UIMessage = UIMessage>(
  options: UseDemoChatOptions<TMessage>
) {
  const [chat] = useState(() => {
    if (options.createChat) {
      return options.createChat();
    }

    return new Chat<TMessage>({
      transport: new DefaultChatTransport({
        api: options.api,
      }),
    });
  });
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
