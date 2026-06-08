"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { customerMemoryProfiles } from "../customer-profiles";
import type { CustomerMemorySessionData } from "../session-data";
import {
  buildCustomerMemorySessionViewState,
  getLatestCustomerMemoryPrompt,
} from "./customer-memory-session";
import {
  type CustomerMemoryRefreshSession,
  type CustomerMemorySelection,
  createCustomerMemoryThread,
  getDefaultCustomerMemorySelection,
  getStoredCustomerMemorySelection,
  reportCustomerMemorySessionRefreshError,
  useCustomerMemoryChatRuntime,
  useCustomerMemorySessionLoader,
} from "./use-customer-memory-session-runtime";

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
  const selectionRef = useRef<CustomerMemorySelection>({
    customerId: initialSelection.customerId,
    threadId: null,
  });
  const latestRefreshRequestIdRef = useRef(0);
  const refreshSessionRef = useRef<CustomerMemoryRefreshSession>(
    async () => undefined
  );
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
  } = useCustomerMemoryChatRuntime({
    refreshSessionRef,
    selectionRef,
  });
  const latestPrompt = useMemo(
    () => getLatestCustomerMemoryPrompt(messages),
    [messages]
  );
  const { applySession, refreshSession } = useCustomerMemorySessionLoader({
    clearError,
    latestRefreshRequestIdRef,
    selectionRef,
    setActiveThreadId,
    setCustomerId,
    setIsSessionLoading,
    setMessages,
    setSession,
    setSessionErrorMessage,
  });

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

    clearError();
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
