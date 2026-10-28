"use client";

import { type RefObject, useEffect } from "react";
import { useBeforeDemoSessionReset } from "@/components/demo-session";
import type { CustomerMemorySessionData } from "../session-data";
import {
  type CustomerMemoryRefreshSession,
  type CustomerMemorySelection,
  createCustomerMemoryThread,
  getDefaultCustomerMemorySelection,
} from "./use-customer-memory-session-runtime";

export function useCustomerMemorySessionReset(input: {
  applySession: (session: CustomerMemorySessionData) => void;
  isReadonlyAccount: boolean;
  latestRefreshRequestIdRef: RefObject<number>;
  refreshSession: CustomerMemoryRefreshSession;
  refreshSessionRef: RefObject<CustomerMemoryRefreshSession>;
  selectionRef: RefObject<CustomerMemorySelection>;
  stop: () => void | Promise<void>;
}) {
  const { refreshSession, refreshSessionRef, latestRefreshRequestIdRef } =
    input;
  useEffect(() => {
    refreshSessionRef.current = refreshSession;
    return () => {
      latestRefreshRequestIdRef.current += 1;
      refreshSessionRef.current = async () => undefined;
    };
  }, [refreshSession, refreshSessionRef, latestRefreshRequestIdRef]);

  useBeforeDemoSessionReset(async () => {
    await input.stop();
    latestRefreshRequestIdRef.current += 1;
    const nextSession = await createCustomerMemoryThread(
      input.isReadonlyAccount
        ? getDefaultCustomerMemorySelection().customerId
        : input.selectionRef.current.customerId
    );
    input.applySession(nextSession);
  });
}
