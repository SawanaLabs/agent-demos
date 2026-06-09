"use client";

import type { ChatStatus, UIMessage } from "ai";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { customerMemoryProfiles } from "../customer-profiles";
import type { CustomerMemorySessionData } from "../session-data";
import {
  buildCustomerMemorySessionViewState,
  getLatestCustomerMemoryPrompt,
} from "./customer-memory-session";
import {
  type CustomerMemoryRefreshSession,
  type CustomerMemorySelection,
  compactCustomerMemoryThread,
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
  compactContext: () => Promise<void>;
  createThread: () => Promise<void>;
  customerId: string;
  isBusy: boolean;
  isCompactingContext: boolean;
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
  const { compactContext, isCompactingContext } =
    useCustomerMemoryCompactionAction({
      clearError,
      isBusy,
      isReadonlyAccount,
      latestPrompt,
      refreshSession,
      selectionRef,
      setSessionErrorMessage,
    });
  const createThread = createCustomerMemoryThreadAction({
    applySession,
    isBusy,
    isCompactingContext,
    isReadonlyAccount,
    selectionRef,
    setIsSessionLoading,
    setSession,
    setSessionErrorMessage,
  });

  refreshSessionRef.current = refreshSession;

  useStoredCustomerMemorySelection({
    selectionRef,
    setActiveThreadId,
    setCustomerId,
  });
  useCustomerMemoryInitialSessionRefresh({
    isChatAvailable,
    refreshSession,
    setIsSessionLoading,
  });

  async function selectCustomer(nextCustomerId: string) {
    if (
      isBusy ||
      isCompactingContext ||
      nextCustomerId === selectionRef.current.customerId
    ) {
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
      isCompactingContext ||
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

  async function sendPrompt(text: string) {
    const trimmedText = text.trim();

    if (
      !(trimmedText && selectionRef.current.threadId) ||
      isCompactingContext ||
      isReadonlyAccount
    ) {
      return;
    }

    await sendMessage({ text: trimmedText });
  }

  async function regenerateLastTurn() {
    if (
      !selectionRef.current.threadId ||
      isCompactingContext ||
      isReadonlyAccount
    ) {
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
    isCompactingContext,
    isReady: isChatAvailable && activeThreadId !== null,
    isSessionLoading,
    latestPrompt,
    messages,
    session,
    sessionErrorMessage,
    status,
    viewState: buildCustomerMemorySessionViewState(session),
    compactContext,
    createThread,
    regenerateLastTurn,
    refreshSession,
    selectCustomer,
    selectThread,
    sendPrompt,
    stopChat: stop,
  };
}

function useStoredCustomerMemorySelection(input: {
  selectionRef: RefObject<CustomerMemorySelection>;
  setActiveThreadId: (threadId: string | null) => void;
  setCustomerId: (customerId: string) => void;
}) {
  const { selectionRef, setActiveThreadId, setCustomerId } = input;

  useEffect(() => {
    const storedSelection = getStoredCustomerMemorySelection();

    selectionRef.current = {
      customerId: storedSelection.customerId,
      threadId: storedSelection.threadId,
    };
    setCustomerId(storedSelection.customerId);
    setActiveThreadId(storedSelection.threadId);
  }, [selectionRef, setActiveThreadId, setCustomerId]);
}

function useCustomerMemoryInitialSessionRefresh(input: {
  isChatAvailable: boolean;
  refreshSession: CustomerMemoryRefreshSession;
  setIsSessionLoading: (isSessionLoading: boolean) => void;
}) {
  const { isChatAvailable, refreshSession, setIsSessionLoading } = input;

  useEffect(() => {
    if (!isChatAvailable) {
      setIsSessionLoading(false);
      return;
    }

    refreshSession().catch(reportCustomerMemorySessionRefreshError);
  }, [isChatAvailable, refreshSession, setIsSessionLoading]);
}

function createCustomerMemoryThreadAction(input: {
  applySession: (session: CustomerMemorySessionData) => void;
  isBusy: boolean;
  isCompactingContext: boolean;
  isReadonlyAccount: boolean;
  selectionRef: RefObject<CustomerMemorySelection>;
  setIsSessionLoading: (isSessionLoading: boolean) => void;
  setSession: (session: CustomerMemorySessionData | null) => void;
  setSessionErrorMessage: (message: string | null) => void;
}) {
  return async function createThread() {
    if (input.isBusy || input.isCompactingContext || input.isReadonlyAccount) {
      return;
    }

    input.setIsSessionLoading(true);
    input.setSessionErrorMessage(null);
    input.setSession(null);

    try {
      const nextSession = await createCustomerMemoryThread(
        input.selectionRef.current.customerId
      );

      input.applySession(nextSession);
    } catch (threadError) {
      input.setSessionErrorMessage(
        threadError instanceof Error
          ? threadError.message
          : "Failed to create a new customer-memory thread."
      );
    } finally {
      input.setIsSessionLoading(false);
    }
  };
}

function useCustomerMemoryCompactionAction(input: {
  clearError: () => void;
  isBusy: boolean;
  isReadonlyAccount: boolean;
  latestPrompt: string;
  refreshSession: CustomerMemoryRefreshSession;
  selectionRef: RefObject<CustomerMemorySelection>;
  setSessionErrorMessage: (message: string | null) => void;
}) {
  const [isCompactingContext, setIsCompactingContext] = useState(false);

  async function compactContext() {
    const currentSelection = input.selectionRef.current;

    if (
      input.isBusy ||
      input.isReadonlyAccount ||
      isCompactingContext ||
      !currentSelection.threadId
    ) {
      return;
    }

    setIsCompactingContext(true);
    input.setSessionErrorMessage(null);
    input.clearError();

    try {
      await compactCustomerMemoryThread({
        customerId: currentSelection.customerId,
        threadId: currentSelection.threadId,
      });
      await input.refreshSession(input.latestPrompt);
    } catch (compactionError) {
      input.setSessionErrorMessage(
        compactionError instanceof Error
          ? compactionError.message
          : "Failed to compact the customer-memory context."
      );
    } finally {
      setIsCompactingContext(false);
    }
  }

  return {
    compactContext,
    isCompactingContext,
  };
}
