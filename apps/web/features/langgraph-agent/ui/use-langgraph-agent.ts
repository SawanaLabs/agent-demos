"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRef, useState } from "react";

import type {
  LangGraphAgentDataParts,
  LangGraphProgressData,
} from "../server/stream-normalizer";

export type LangGraphAgentMessage = UIMessage<unknown, LangGraphAgentDataParts>;

export function createLangGraphThreadId() {
  return crypto.randomUUID();
}

function isGraphProgressDataPart(dataPart: unknown): dataPart is {
  data: LangGraphProgressData;
  type: "data-graph-progress";
} {
  return (
    typeof dataPart === "object" &&
    dataPart !== null &&
    (dataPart as { type?: unknown }).type === "data-graph-progress"
  );
}

export function useLangGraphAgent() {
  const threadIdRef = useRef(createLangGraphThreadId());
  const [threadId, setThreadId] = useState(threadIdRef.current);
  const [graphEvents, setGraphEvents] = useState<LangGraphProgressData[]>([]);
  const [chat] = useState(
    () =>
      new Chat<LangGraphAgentMessage>({
        onData(dataPart) {
          if (isGraphProgressDataPart(dataPart)) {
            setGraphEvents((current) => [...current, dataPart.data]);
          }
        },
        transport: new DefaultChatTransport<LangGraphAgentMessage>({
          api: "/api/demos/langgraph-agent",
          prepareSendMessagesRequest({ messages }) {
            return {
              body: {
                messages,
                threadId: threadIdRef.current,
              },
            };
          },
        }),
      })
  );
  const controller = useChat({ chat });
  const hasMessages = controller.messages.length > 0;
  const isBusy =
    controller.status === "submitted" || controller.status === "streaming";

  return {
    ...controller,
    graphEvents,
    hasMessages,
    isBusy,
    startNewThread() {
      const nextThreadId = createLangGraphThreadId();
      threadIdRef.current = nextThreadId;
      setThreadId(nextThreadId);
      setGraphEvents([]);
      controller.clearError();
      controller.setMessages([]);
    },
    threadId,
  };
}
