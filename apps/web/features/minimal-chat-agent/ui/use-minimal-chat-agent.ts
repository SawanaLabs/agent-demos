"use client";

import { Chat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";

import type { MinimalChatAgentUIMessage } from "../types";

export function useMinimalChatAgent() {
  return useDemoChat<MinimalChatAgentUIMessage>({
    createChat: () =>
      new Chat<MinimalChatAgentUIMessage>({
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        transport: new DefaultChatTransport({
          api: "/api/demos/minimal-chat-agent",
        }),
      }),
  });
}
