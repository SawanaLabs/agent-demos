"use client";

import { Button } from "@workspace/ui/components/button";
import { RotateCcwIcon } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type BeforeSessionReset = () => void | Promise<void>;

interface DemoSessionContextValue {
  clearSession: () => Promise<void>;
  error: string | null;
  isClearing: boolean;
  registerBeforeReset: (callback: BeforeSessionReset) => () => void;
}

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null);

export function DemoSession({
  children,
  resetHref,
}: {
  children: ReactNode;
  resetHref?: string;
}) {
  const [version, setVersion] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearingRef = useRef(false);
  const beforeResetRef = useRef<BeforeSessionReset | null>(null);
  const registerBeforeReset = useCallback((callback: BeforeSessionReset) => {
    beforeResetRef.current = callback;
    return () => {
      if (beforeResetRef.current === callback) {
        beforeResetRef.current = null;
      }
    };
  }, []);
  const clearSession = useCallback(async () => {
    if (clearingRef.current) {
      return;
    }
    clearingRef.current = true;
    setIsClearing(true);
    setError(null);
    try {
      await beforeResetRef.current?.();
      if (resetHref) {
        window.location.replace(resetHref);
        return;
      }
      setVersion((current) => current + 1);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to clear session."
      );
    } finally {
      clearingRef.current = false;
      setIsClearing(false);
    }
  }, [resetHref]);
  const value = useMemo(
    () => ({ clearSession, error, isClearing, registerBeforeReset }),
    [clearSession, error, isClearing, registerBeforeReset]
  );

  return (
    <DemoSessionContext.Provider key={version} value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useBeforeDemoSessionReset(callback: BeforeSessionReset) {
  const context = useContext(DemoSessionContext);
  const register = context?.registerBeforeReset;
  useEffect(() => register?.(callback), [callback, register]);
}

export function DemoSessionResetButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const context = useContext(DemoSessionContext);
  if (!context) {
    throw new Error("DemoSessionResetButton requires DemoSession.");
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <Button
        disabled={disabled || context.isClearing}
        onClick={context.clearSession}
        size="sm"
        type="button"
        variant="outline"
      >
        <RotateCcwIcon aria-hidden="true" className="size-4" />
        {context.isClearing ? "Clearing…" : "Clear session"}
      </Button>
      {context.error ? (
        <p className="max-w-64 text-destructive text-xs" role="alert">
          {context.error}
        </p>
      ) : null}
    </div>
  );
}
