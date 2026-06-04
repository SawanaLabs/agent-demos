"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  LangGraphAgentDataParts,
  LangGraphProgressData,
} from "@/lib/langgraph-agent/server/stream-normalizer";

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
  const threadIdRef = useRef<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const ensureThreadId = useCallback(() => {
    if (threadIdRef.current) {
      return threadIdRef.current;
    }

    const nextThreadId = createLangGraphThreadId();
    threadIdRef.current = nextThreadId;
    setThreadId(nextThreadId);

    return nextThreadId;
  }, []);
  const [graphEvents, setGraphEvents] = useState<LangGraphProgressData[]>([]);
  /* eslint-disable react-hooks/refs -- Chat transport callbacks run after render and need the current thread id. */
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
                threadId: ensureThreadId(),
              },
            };
          },
        }),
      })
  );
  /* eslint-enable react-hooks/refs */
  const controller = useChat({ chat });
  const hasMessages = controller.messages.length > 0;
  const isBusy =
    controller.status === "submitted" || controller.status === "streaming";

  useEffect(() => {
    ensureThreadId();
  }, [ensureThreadId]);

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
