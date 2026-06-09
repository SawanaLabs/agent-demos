"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useState } from "react";

import { getCustomerMemoryCompactionControlState } from "./customer-memory-session";

interface CustomerMemoryManualCompactActionProps {
  compactionThreshold: number;
  isBusy: boolean;
  isCompactingContext: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
  latestCompactionMessageCount: number | null;
  messageCount: number;
  onCompactContext: () => Promise<void>;
}

export function CustomerMemoryManualCompactAction({
  compactionThreshold,
  isBusy,
  isCompactingContext,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
  latestCompactionMessageCount,
  messageCount,
  onCompactContext,
}: CustomerMemoryManualCompactActionProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const controlState = getCustomerMemoryCompactionControlState({
    compactionThreshold,
    latestCompactionMessageCount,
    messageCount,
  });
  const isDisabled =
    !isReady ||
    isBusy ||
    isReadonlyAccount ||
    isSessionLoading ||
    isCompactingContext ||
    !controlState.canCompactManually;
  const tooltip = getCustomerMemoryManualCompactTooltip({
    compactionThreshold,
    controlState,
    isBusy,
    isCompactingContext,
    isReadonlyAccount,
    isReady,
    isSessionLoading,
  });

  return (
    <AlertDialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            aria-label="Compact context"
            disabled={isDisabled}
            onClick={() => setIsConfirmOpen(true)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            {isCompactingContext ? (
              <Spinner className="size-3.5" />
            ) : (
              <CustomerMemoryCompactionProgressRing
                progressRatio={controlState.progressRatio}
              />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent align="end" className="max-w-72 text-pretty">
          {tooltip}
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Compact older context?</AlertDialogTitle>
          <AlertDialogDescription>
            Future replies will use a handoff summary for older messages.
            Original messages stay visible, but this cannot be undone from the
            UI.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isCompactingContext}
            onClick={() => {
              setIsConfirmOpen(false);
              onCompactContext();
            }}
          >
            Compact context
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CustomerMemoryCompactionProgressRing({
  progressRatio,
}: {
  progressRatio: number;
}) {
  const degrees = Math.round(progressRatio * 360);

  return (
    <span
      aria-hidden="true"
      className="relative size-4 rounded-full text-foreground"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(currentColor ${degrees}deg, transparent ${degrees}deg)`,
        }}
      />
      <span className="absolute inset-[2px] rounded-full bg-background ring-1 ring-foreground/20" />
    </span>
  );
}

function getCustomerMemoryManualCompactTooltip({
  compactionThreshold,
  controlState,
  isBusy,
  isCompactingContext,
  isReadonlyAccount,
  isReady,
  isSessionLoading,
}: {
  compactionThreshold: number;
  controlState: ReturnType<typeof getCustomerMemoryCompactionControlState>;
  isBusy: boolean;
  isCompactingContext: boolean;
  isReadonlyAccount: boolean;
  isReady: boolean;
  isSessionLoading: boolean;
}) {
  if (isReadonlyAccount) {
    return "Switch to Demo Sandbox to compact context.";
  }

  if (!isReady) {
    return "Select a writable thread before compacting context.";
  }

  if (isSessionLoading) {
    return "Session is loading.";
  }

  if (isBusy) {
    return "Wait for the current turn to finish before compacting context.";
  }

  if (isCompactingContext) {
    return "Compacting older context now.";
  }

  if (!controlState.canCompactManually) {
    return `${controlState.remainingUntilAutomaticCompact} messages until automatic compact. Manual compact is available after more than 2 uncompacted messages.`;
  }

  return `${controlState.uncompactedMessageCount}/${compactionThreshold} uncompacted messages. Manual compact will summarize ${controlState.compactableMessageCount} older message(s) and keep the latest 2.`;
}
