"use client";

import { Chat, useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useState } from "react";

export function useLoopAgentChat() {
  const [chat] = useState(
    () =>
      new Chat({
        sendAutomaticallyWhen:
          lastAssistantMessageIsCompleteWithApprovalResponses,
        transport: new DefaultChatTransport({
          api: "/api/demos/loop-agent",
        }),
      })
  );
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
