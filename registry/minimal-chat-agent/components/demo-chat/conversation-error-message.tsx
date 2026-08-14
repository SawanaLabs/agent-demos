"use client";

import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCcwIcon } from "lucide-react";
import { useCallback } from "react";

interface ConversationErrorMessageProps {
  className?: string;
  error: Error | string;
  isRetryDisabled?: boolean;
  onRetry?: () => Promise<void> | void;
  retryLabel?: string;
  title?: string;
}

interface UseConversationErrorRetryInput {
  clearError: () => void;
  regenerate: () => Promise<void>;
}

export function useConversationErrorRetry({
  clearError,
  regenerate,
}: UseConversationErrorRetryInput) {
  return useCallback(async () => {
    clearError();
    await regenerate();
  }, [clearError, regenerate]);
}

export function ConversationErrorMessage({
  className,
  error,
  isRetryDisabled = false,
  retryLabel = "Retry",
  onRetry,
  title = "Assistant response failed",
}: ConversationErrorMessageProps) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <Message from="assistant">
      <MessageContent
        className={cn(
          "max-w-3xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-destructive",
          className
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium text-sm">{title}</p>
            <p className="mt-1 break-words text-xs/relaxed opacity-90">
              {errorMessage}
            </p>
          </div>
          {onRetry ? (
            <Button
              className="self-start"
              disabled={isRetryDisabled}
              onClick={() => {
                void onRetry();
              }}
              size="sm"
              type="button"
              variant="destructive"
            >
              <RefreshCcwIcon className="size-3.5" />
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </MessageContent>
    </Message>
  );
}
