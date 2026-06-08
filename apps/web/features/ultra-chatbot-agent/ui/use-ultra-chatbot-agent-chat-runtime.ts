"use client";

import { useChat } from "@ai-sdk/react";
import {
  type ChatStatus,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useConversationErrorRetry } from "@/features/shared/chat/ui/conversation-error-message";

import type {
  UltraChatbotAgentChatRecord,
  UltraChatbotAgentChatSession,
} from "../server/chat-store";
import {
  buildHistoryTitleFromMessages,
  buildUltraChatbotAgentChatRecordHint,
  toConversationPath,
} from "./ultra-chatbot-agent-workspace-api";
import type { UltraChatbotAgentWorkspaceChatMeta } from "./ultra-chatbot-agent-workspace-model";

function createUltraChatbotAgentTransport(input: {
  selectedChatModelRef: RefObject<string>;
  selectedVisibilityRef: RefObject<"private" | "public">;
}) {
  return new DefaultChatTransport({
    api: "/api/demos/ultra-chatbot-agent",
    credentials: "include",
    prepareReconnectToStreamRequest: ({ id }) => ({
      api: `/api/demos/ultra-chatbot-agent/${id}/stream`,
      credentials: "include",
    }),
    prepareSendMessagesRequest: ({
      id,
      messageId,
      messages: nextMessages,
      trigger,
    }) => ({
      body: {
        id,
        message: nextMessages.at(-1),
        messageId,
        selectedChatModel: input.selectedChatModelRef.current,
        selectedVisibilityType: input.selectedVisibilityRef.current,
        trigger,
      },
    }),
  });
}

export function useUltraChatbotAgentChatRuntime(input: {
  defaultChatModel: string;
  draftChatId: string;
  initialSession: UltraChatbotAgentChatSession | null;
}): {
  addToolApprovalResponse: (response: {
    approved: boolean;
    id: string;
    reason: string;
  }) => PromiseLike<void> | void;
  chatId: string;
  chatMeta: UltraChatbotAgentWorkspaceChatMeta;
  currentChatRecordHint: UltraChatbotAgentChatRecord | null;
  error: Error | undefined;
  handleModelChange: (modelId: string) => void;
  handleSubmit: (parts: UIMessage["parts"]) => Promise<void>;
  handleVisibilityChange: (visibility: "private" | "public") => void;
  hasMessages: boolean;
  isBusy: boolean;
  latestMessageRole: UIMessage["role"] | undefined;
  messages: UIMessage[];
  regenerate: () => PromiseLike<void> | void;
  resumeStream: () => PromiseLike<void> | void;
  retryConversationError: () => Promise<void>;
  setChatMeta: Dispatch<SetStateAction<UltraChatbotAgentWorkspaceChatMeta>>;
  setMessages: (
    messages: UIMessage[] | ((currentMessages: UIMessage[]) => UIMessage[])
  ) => void;
  status: ChatStatus;
  stop: () => void;
} {
  const { defaultChatModel, draftChatId, initialSession } = input;
  const generatedChatIdRef = useRef(initialSession?.chat.id ?? draftChatId);
  const hasPromotedRouteRef = useRef(Boolean(initialSession));
  const chatId = generatedChatIdRef.current;
  const [chatMeta, setChatMeta] = useState<UltraChatbotAgentWorkspaceChatMeta>(
    () => ({
      capabilities: initialSession?.chat.capabilities ?? {
        sandboxEnabled: false,
      },
      createdAt: initialSession?.chat.createdAt ?? null,
      id: chatId,
      selectedChatModel:
        initialSession?.chat.selectedChatModel ?? defaultChatModel,
      updatedAt: initialSession?.chat.updatedAt ?? null,
      visibility: initialSession?.chat.visibility ?? "private",
    })
  );
  const selectedChatModelRef = useRef(chatMeta.selectedChatModel);
  const selectedVisibilityRef = useRef(chatMeta.visibility);
  const transport = useMemo(
    () =>
      createUltraChatbotAgentTransport({
        selectedChatModelRef,
        selectedVisibilityRef,
      }),
    []
  );
  const {
    addToolApprovalResponse,
    clearError,
    error,
    messages,
    regenerate,
    resumeStream,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    id: chatId,
    messages: initialSession?.messages ?? [],
    resume: initialSession?.chat.activeStreamId != null,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport,
  });
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const hasMessages = messages.length > 0;
  const currentChatTitle = hasMessages
    ? buildHistoryTitleFromMessages(messages)
    : "New chat";
  const currentChatRecordHint = useMemo(
    () =>
      buildUltraChatbotAgentChatRecordHint({
        chatMeta,
        currentChatTitle,
        hasMessages,
        visitorId: initialSession?.chat.visitorId,
      }),
    [chatMeta, currentChatTitle, hasMessages, initialSession?.chat.visitorId]
  );

  useEffect(() => {
    selectedChatModelRef.current = chatMeta.selectedChatModel;
    selectedVisibilityRef.current = chatMeta.visibility;
  }, [chatMeta.selectedChatModel, chatMeta.visibility]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    setChatMeta((current) => ({
      ...current,
      createdAt: current.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, [messages.length]);

  async function handleSubmit(parts: UIMessage["parts"]) {
    if (parts.length === 0) {
      return;
    }

    if (!hasPromotedRouteRef.current) {
      hasPromotedRouteRef.current = true;
      window.history.replaceState({}, "", toConversationPath(chatId));
      setChatMeta((current) => ({
        ...current,
        createdAt: current.createdAt ?? new Date().toISOString(),
      }));
    }

    await sendMessage({
      parts,
      role: "user",
    });
  }

  function handleModelChange(modelId: string) {
    selectedChatModelRef.current = modelId;
    setChatMeta((current) => ({
      ...current,
      selectedChatModel: modelId,
    }));
  }

  function handleVisibilityChange(visibility: "private" | "public") {
    selectedVisibilityRef.current = visibility;
    setChatMeta((current) => ({
      ...current,
      visibility,
    }));
  }

  async function handleRetryConversationError() {
    await retryConversationError();
  }

  return {
    addToolApprovalResponse,
    chatId,
    chatMeta,
    currentChatRecordHint,
    error,
    handleModelChange,
    handleSubmit,
    handleVisibilityChange,
    hasMessages,
    isBusy: status === "submitted" || status === "streaming",
    latestMessageRole: messages.at(-1)?.role,
    messages,
    regenerate,
    resumeStream,
    retryConversationError: handleRetryConversationError,
    setChatMeta,
    setMessages,
    status,
    stop,
  };
}
