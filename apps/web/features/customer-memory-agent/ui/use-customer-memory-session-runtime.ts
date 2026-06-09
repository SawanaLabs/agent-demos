"use client";

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
} from "react";
import { customerMemoryProfiles } from "../customer-profiles";
import type { CustomerMemorySessionData } from "../session-data";
import {
  getLatestCustomerMemoryPrompt,
  removeEmptyCustomerMemoryAssistantMessages,
} from "./customer-memory-session";
import { useCustomerMemoryChat } from "./use-customer-memory-chat";

export interface CustomerMemorySelection {
  customerId: string;
  threadId: string | null;
}

export interface CustomerMemoryRefreshSessionOptions {
  fallbackMessages?: UIMessage[];
}

export type CustomerMemoryRefreshSession = (
  query?: string,
  options?: CustomerMemoryRefreshSessionOptions
) => Promise<void>;

interface UseCustomerMemoryChatRuntimeInput {
  refreshSessionRef: RefObject<CustomerMemoryRefreshSession>;
  selectionRef: RefObject<CustomerMemorySelection>;
}

interface UseCustomerMemorySessionLoaderInput {
  clearError: () => void;
  latestRefreshRequestIdRef: RefObject<number>;
  selectionRef: RefObject<CustomerMemorySelection>;
  setActiveThreadId: Dispatch<SetStateAction<string | null>>;
  setCustomerId: Dispatch<SetStateAction<string>>;
  setIsSessionLoading: Dispatch<SetStateAction<boolean>>;
  setMessages: (messages: UIMessage[]) => void;
  setSession: Dispatch<SetStateAction<CustomerMemorySessionData | null>>;
  setSessionErrorMessage: Dispatch<SetStateAction<string | null>>;
}

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

export async function createCustomerMemoryThread(customerId: string) {
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

export async function compactCustomerMemoryThread(input: {
  customerId: string;
  threadId: string;
}) {
  const response = await fetch("/api/demos/customer-memory-agent/compact", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      message?: string;
    } | null;

    throw new Error(
      payload?.error ||
        payload?.message ||
        "Failed to compact the customer-memory context."
    );
  }

  return response.json() as Promise<{
    compaction: CustomerMemorySessionData["latestCompaction"];
  }>;
}

export function getDefaultCustomerMemorySelection(): CustomerMemorySelection {
  return {
    customerId: customerMemoryProfiles[0]?.id ?? "acme-co",
    threadId: null,
  };
}

export function getStoredCustomerMemorySelection(): CustomerMemorySelection {
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

function persistCustomerMemorySelection(input: CustomerMemorySelection) {
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

export function reportCustomerMemorySessionRefreshError(error: unknown) {
  console.error("Failed to refresh customer-memory session.", error);
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

export function useCustomerMemoryChatRuntime(
  input: UseCustomerMemoryChatRuntimeInput
) {
  return useCustomerMemoryChat<UIMessage>({
    createChat: () =>
      new Chat<UIMessage>({
        onFinish: ({ messages }) => {
          const latestPrompt = getLatestCustomerMemoryPrompt(messages);

          input.refreshSessionRef
            .current(latestPrompt, {
              fallbackMessages: messages,
            })
            .catch(reportCustomerMemorySessionRefreshError);
        },
        transport: new DefaultChatTransport({
          api: "/api/demos/customer-memory-agent",
          prepareSendMessagesRequest({ body, messages }) {
            const threadId = input.selectionRef.current.threadId;

            if (!threadId) {
              throw new Error(
                "No active customer-memory thread is selected for this request."
              );
            }

            return {
              body: {
                ...body,
                customerId: input.selectionRef.current.customerId,
                messages,
                threadId,
              },
            };
          },
        }),
      }),
  });
}

export function useCustomerMemorySessionLoader(
  input: UseCustomerMemorySessionLoaderInput
) {
  const {
    clearError,
    latestRefreshRequestIdRef,
    selectionRef,
    setActiveThreadId,
    setCustomerId,
    setIsSessionLoading,
    setMessages,
    setSession,
    setSessionErrorMessage,
  } = input;
  const applySession = useCallback(
    (
      nextSession: CustomerMemorySessionData,
      options?: CustomerMemoryRefreshSessionOptions
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
    [
      clearError,
      selectionRef,
      setActiveThreadId,
      setCustomerId,
      setMessages,
      setSession,
    ]
  );
  const refreshSession = useCallback<CustomerMemoryRefreshSession>(
    async (query, options) => {
      const currentSelection = selectionRef.current;
      const requestId = latestRefreshRequestIdRef.current + 1;
      latestRefreshRequestIdRef.current = requestId;
      setIsSessionLoading(true);
      setSessionErrorMessage(null);

      try {
        const nextSession = await fetchCustomerMemorySession({
          customerId: currentSelection.customerId,
          query: query ?? "",
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
    [
      applySession,
      latestRefreshRequestIdRef,
      selectionRef,
      setIsSessionLoading,
      setSessionErrorMessage,
    ]
  );

  return {
    applySession,
    refreshSession,
  };
}
