"use client";

import { Chat } from "@ai-sdk/react";
import { type ChatStatus, DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";
import { customerMemoryProfiles } from "../customer-profiles";
import type { CustomerMemorySessionData } from "../session-data";
import {
  buildCustomerMemorySessionViewState,
  getLatestCustomerMemoryPrompt,
  removeEmptyCustomerMemoryAssistantMessages,
} from "./customer-memory-session";

async function fetchCustomerMemorySession(input: {
  customerId: string;
  query?: string;
  threadId?: string | null;
}) {
  const params = new URLSearchParams({
    customerId: input.customerId,
  });

  if (input.query?.trim()) {
    params.set("query", input.query.trim());
  }

  if (input.threadId?.trim()) {
    params.set("threadId", input.threadId.trim());
  }

  const response = await fetch(
    `/api/demos/customer-memory-agent/session?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      (await response.text()) || "Failed to load the customer-memory session."
    );
  }

  return (await response.json()) as CustomerMemorySessionData;
}

async function createCustomerMemoryThread(customerId: string) {
  const response = await fetch("/api/demos/customer-memory-agent/threads", {
    body: JSON.stringify({ customerId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      (await response.text()) || "Failed to create a customer-memory thread."
    );
  }

  return (await response.json()) as CustomerMemorySessionData;
}

function getDefaultCustomerMemorySelection() {
  return {
    customerId: customerMemoryProfiles[0]?.id ?? "acme-co",
    threadId: null as string | null,
  };
}

function getStoredCustomerMemorySelection() {
  if (typeof window === "undefined") {
    return getDefaultCustomerMemorySelection();
  }

  return {
    customerId:
      window.localStorage.getItem("customer-memory-agent.customer-id") ??
      getDefaultCustomerMemorySelection().customerId,
    threadId:
      window.localStorage.getItem("customer-memory-agent.thread-id") ?? null,
  };
}

function persistCustomerMemorySelection(input: {
  customerId: string;
  threadId: string | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    "customer-memory-agent.customer-id",
    input.customerId
  );

  if (input.threadId) {
    window.localStorage.setItem(
      "customer-memory-agent.thread-id",
      input.threadId
    );
    return;
  }

  window.localStorage.removeItem("customer-memory-agent.thread-id");
}

function reportCustomerMemorySessionRefreshError(error: unknown) {
  console.error("Failed to refresh customer-memory session.", error);
}

export interface CustomerMemorySessionController {
  activeThreadId: string | null;
  chatErrorMessage: string | null;
  createThread: () => Promise<void>;
  customerId: string;
  isBusy: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  latestPrompt: string;
  messages: UIMessage[];
  refreshSession: (query?: string) => Promise<void>;
  regenerateLastTurn: () => Promise<void>;
  selectCustomer: (customerId: string) => Promise<void>;
  selectThread: (threadId: string) => Promise<void>;
  sendPrompt: (text: string) => Promise<void>;
  session: CustomerMemorySessionData | null;
  sessionErrorMessage: string | null;
  status: ChatStatus;
  stopChat: () => void;
  viewState: ReturnType<typeof buildCustomerMemorySessionViewState>;
}

export function resolveCustomerMemorySessionMessages(input: {
  fallbackMessages?: UIMessage[];
  nextSession: CustomerMemorySessionData;
}) {
  const fallbackMessages = removeEmptyCustomerMemoryAssistantMessages(
    input.fallbackMessages ?? []
  );

  if (fallbackMessages.length <= input.nextSession.messages.length) {
    return input.nextSession.messages;
  }

  return fallbackMessages;
}

export function shouldApplyCustomerMemorySessionRefresh(input: {
  latestRequestId: number;
  requestId: number;
}) {
  return input.requestId === input.latestRequestId;
}

export function useCustomerMemorySession(
  isChatAvailable: boolean
): CustomerMemorySessionController {
  const initialSelection = useMemo(getDefaultCustomerMemorySelection, []);
  const [customerId, setCustomerId] = useState(initialSelection.customerId);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [session, setSession] = useState<CustomerMemorySessionData | null>(
    null
  );
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(
    null
  );
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const selectionRef = useRef({
    customerId: initialSelection.customerId,
    threadId: null as string | null,
  });
  const latestRefreshRequestIdRef = useRef(0);
  const activeProfile = useMemo(
    () =>
      customerMemoryProfiles.find((profile) => profile.id === customerId) ??
      customerMemoryProfiles[0],
    [customerId]
  );
  const isReadonlyAccount = activeProfile?.accessMode === "shared_readonly";
  const {
    clearError,
    error,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useDemoChat<UIMessage>({
    createChat: () =>
      new Chat<UIMessage>({
        onFinish: ({ messages }) => {
          const latestPrompt = getLatestCustomerMemoryPrompt(messages);

          refreshSessionRef
            .current(latestPrompt, {
              fallbackMessages: messages,
            })
            .catch(reportCustomerMemorySessionRefreshError);
        },
        transport: new DefaultChatTransport({
          api: "/api/demos/customer-memory-agent",
          prepareSendMessagesRequest({ body, messages }) {
            const threadId = selectionRef.current.threadId;

            if (!threadId) {
              throw new Error(
                "No active customer-memory thread is selected for this request."
              );
            }

            return {
              body: {
                ...body,
                customerId: selectionRef.current.customerId,
                messages,
                threadId,
              },
            };
          },
        }),
      }),
  });
  const latestPrompt = useMemo(
    () => getLatestCustomerMemoryPrompt(messages),
    [messages]
  );
  const refreshSessionRef = useRef<
    (
      query?: string,
      options?: {
        fallbackMessages?: UIMessage[];
      }
    ) => Promise<void>
  >(async () => undefined);

  const applySession = useCallback(
    (
      nextSession: CustomerMemorySessionData,
      options?: { fallbackMessages?: UIMessage[] }
    ) => {
      const resolvedMessages = resolveCustomerMemorySessionMessages({
        fallbackMessages: options?.fallbackMessages,
        nextSession,
      });

      setSession({
        ...nextSession,
        messages: resolvedMessages,
      });
      setCustomerId(nextSession.customer.id);
      setActiveThreadId(nextSession.thread.id);
      selectionRef.current = {
        customerId: nextSession.customer.id,
        threadId: nextSession.thread.id,
      };
      persistCustomerMemorySelection({
        customerId: nextSession.customer.id,
        threadId: nextSession.thread.id,
      });
      setMessages(resolvedMessages);
      clearError();
    },
    [clearError, setMessages]
  );

  const refreshSession = useCallback(
    async (
      query = "",
      options?: {
        fallbackMessages?: UIMessage[];
      }
    ) => {
      const currentSelection = selectionRef.current;
      const requestId = latestRefreshRequestIdRef.current + 1;
      latestRefreshRequestIdRef.current = requestId;
      setIsSessionLoading(true);
      setSessionErrorMessage(null);

      try {
        const nextSession = await fetchCustomerMemorySession({
          customerId: currentSelection.customerId,
          query,
          threadId: currentSelection.threadId,
        });

        if (
          !shouldApplyCustomerMemorySessionRefresh({
            latestRequestId: latestRefreshRequestIdRef.current,
            requestId,
          })
        ) {
          return;
        }

        applySession(nextSession, {
          fallbackMessages: options?.fallbackMessages,
        });
      } catch (sessionError) {
        if (
          !shouldApplyCustomerMemorySessionRefresh({
            latestRequestId: latestRefreshRequestIdRef.current,
            requestId,
          })
        ) {
          return;
        }

        setSessionErrorMessage(
          sessionError instanceof Error
            ? sessionError.message
            : "Failed to refresh the customer-memory session."
        );
      } finally {
        if (
          shouldApplyCustomerMemorySessionRefresh({
            latestRequestId: latestRefreshRequestIdRef.current,
            requestId,
          })
        ) {
          setIsSessionLoading(false);
        }
      }
    },
    [applySession]
  );

  refreshSessionRef.current = refreshSession;

  useEffect(() => {
    const storedSelection = getStoredCustomerMemorySelection();

    selectionRef.current = {
      customerId: storedSelection.customerId,
      threadId: storedSelection.threadId,
    };
    setCustomerId(storedSelection.customerId);
    setActiveThreadId(storedSelection.threadId);
  }, []);

  useEffect(() => {
    if (!isChatAvailable) {
      setIsSessionLoading(false);
      return;
    }

    refreshSession().catch(reportCustomerMemorySessionRefreshError);
  }, [isChatAvailable, refreshSession]);

  async function selectCustomer(nextCustomerId: string) {
    if (isBusy || nextCustomerId === selectionRef.current.customerId) {
      return;
    }

    selectionRef.current = {
      customerId: nextCustomerId,
      threadId: null,
    };
    setCustomerId(nextCustomerId);
    setActiveThreadId(null);
    setSession(null);
    setMessages([]);
    clearError();

    await refreshSession();
  }

  async function selectThread(threadId: string) {
    if (
      isBusy ||
      threadId === selectionRef.current.threadId ||
      !selectionRef.current.customerId
    ) {
      return;
    }

    selectionRef.current = {
      customerId: selectionRef.current.customerId,
      threadId,
    };
    setActiveThreadId(threadId);
    setSession(null);
    setMessages([]);
    clearError();

    await refreshSession();
  }

  async function createThread() {
    if (isBusy || isReadonlyAccount) {
      return;
    }

    setIsSessionLoading(true);
    setSessionErrorMessage(null);
    setSession(null);

    try {
      const nextSession = await createCustomerMemoryThread(
        selectionRef.current.customerId
      );

      applySession(nextSession);
    } catch (threadError) {
      setSessionErrorMessage(
        threadError instanceof Error
          ? threadError.message
          : "Failed to create a new customer-memory thread."
      );
    } finally {
      setIsSessionLoading(false);
    }
  }

  async function sendPrompt(text: string) {
    const trimmedText = text.trim();

    if (!(trimmedText && selectionRef.current.threadId) || isReadonlyAccount) {
      return;
    }

    await sendMessage({ text: trimmedText });
  }

  async function regenerateLastTurn() {
    if (!selectionRef.current.threadId || isReadonlyAccount) {
      return;
    }

    await regenerate();
  }

  return {
    activeThreadId,
    chatErrorMessage: error?.message ?? null,
    customerId,
    isReadonlyAccount,
    isBusy,
    isReady: isChatAvailable && activeThreadId !== null,
    isSessionLoading,
    latestPrompt,
    messages,
    session,
    sessionErrorMessage,
    status,
    viewState: buildCustomerMemorySessionViewState(session),
    createThread,
    regenerateLastTurn,
    refreshSession,
    selectCustomer,
    selectThread,
    sendPrompt,
    stopChat: stop,
  };
}
