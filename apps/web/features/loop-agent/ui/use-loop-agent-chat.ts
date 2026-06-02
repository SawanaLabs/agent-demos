"use client";

import { Chat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

export function useLoopAgentChat() {
  return useDemoChat({
    createChat: () =>
      new Chat({
        sendAutomaticallyWhen:
          lastAssistantMessageIsCompleteWithApprovalResponses,
        transport: new DefaultChatTransport({
          api: "/api/demos/loop-agent",
        }),
      }),
  });
}
