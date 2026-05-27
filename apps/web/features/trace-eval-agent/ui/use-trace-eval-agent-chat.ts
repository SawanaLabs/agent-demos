"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import type { TraceEvalAgentMessage } from "../model/trace-eval-run-record";

export function useTraceEvalAgentChat() {
  const [chat] = useState(
    () =>
      new Chat<TraceEvalAgentMessage>({
        transport: new DefaultChatTransport({
          api: "/api/demos/trace-eval-agent",
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
