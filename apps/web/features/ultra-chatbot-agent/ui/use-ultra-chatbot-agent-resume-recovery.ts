"use client";

import type { UIMessage } from "ai";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";

import type { UltraChatbotAgentChatSession } from "../server/chat-store";
import {
  loadUltraChatbotAgentSessionSnapshot,
  shouldApplyRecoveredSession,
} from "./ultra-chatbot-agent-workspace-api";
import type { UltraChatbotAgentWorkspaceChatMeta } from "./ultra-chatbot-agent-workspace-model";

const resumeRecoveryAttemptLimit = 6;

export function useUltraChatbotAgentResumeRecovery(input: {
  chatId: string;
  initialSession: UltraChatbotAgentChatSession | null;
  latestMessageRole: UIMessage["role"] | undefined;
  messagesLength: number;
  setChatMeta: Dispatch<SetStateAction<UltraChatbotAgentWorkspaceChatMeta>>;
  setMessages: (messages: UIMessage[]) => void;
  status: string;
}) {
  const {
    chatId,
    initialSession,
    latestMessageRole,
    messagesLength,
    setChatMeta,
    setMessages,
    status,
  } = input;
  const shouldRecoverMissedResumeRef = useRef(
    initialSession?.chat.activeStreamId != null ||
      initialSession?.messages.at(-1)?.role === "user"
  );
  const initialMessageCountRef = useRef(initialSession?.messages.length ?? 0);

  useEffect(() => {
    if (!shouldRecoverMissedResumeRef.current) {
      return;
    }

    if (status !== "ready") {
      return;
    }

    if (
      messagesLength > initialMessageCountRef.current ||
      latestMessageRole !== "user"
    ) {
      shouldRecoverMissedResumeRef.current = false;
      return;
    }

    let isCancelled = false;
    let timeoutId: number | undefined;
    let attempt = 0;

    const runRecoveryAttempt = () => {
      attempt += 1;

      loadUltraChatbotAgentSessionSnapshot(chatId).then((session) => {
        if (isCancelled) {
          return;
        }

        if (session && shouldApplyRecoveredSession(session, messagesLength)) {
          shouldRecoverMissedResumeRef.current = false;
          setMessages(session.messages);
          setChatMeta({
            capabilities: session.chat.capabilities,
            createdAt: session.chat.createdAt,
            id: session.chat.id,
            selectedChatModel: session.chat.selectedChatModel,
            updatedAt: session.chat.updatedAt,
            visibility: session.chat.visibility,
          });
          return;
        }

        if (attempt >= resumeRecoveryAttemptLimit) {
          shouldRecoverMissedResumeRef.current = false;
          return;
        }

        timeoutId = window.setTimeout(runRecoveryAttempt, 1500);
      });
    };

    timeoutId = window.setTimeout(runRecoveryAttempt, 2500);

    return () => {
      isCancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    chatId,
    latestMessageRole,
    messagesLength,
    setChatMeta,
    setMessages,
    status,
  ]);
}
