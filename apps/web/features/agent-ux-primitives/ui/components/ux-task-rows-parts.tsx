import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, RotateCwIcon, XIcon } from "lucide-react";
import type { RowStatus } from "./ux-task-rows-data";

/**
 * Presentational bits for UxTaskRows — the spinner ring, the round
 * status badge, and the outcome pill.
 */

export function SpinnerRing({ children }: { children?: React.ReactNode }) {
  return (
    <span className="relative grid size-6 shrink-0 place-items-center">
      <svg
        aria-hidden
        className="absolute inset-0 animate-spin [animation-duration:1100ms]"
        fill="none"
        height="24"
        width="24"
      >
        <title>Loading</title>
        <circle
          className="stroke-border"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="2"
        />
        <circle
          className="stroke-muted-foreground"
          cx="12"
          cy="12"
          r="10"
          strokeDasharray="18 45"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      <span className="relative font-semibold text-[10.5px] text-foreground tabular-nums">
        {children}
      </span>
    </span>
  );
}

export function StatusBadge({
  index,
  status,
}: {
  index: number;
  status: RowStatus;
}) {
  if (status === "done") {
    return (
      <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-status-success-500/15 text-status-success-600 dark:text-status-success-300">
        <CheckIcon className="size-3" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-status-danger-500/15 text-status-danger-600 dark:text-status-danger-300">
        <XIcon className="size-3" />
      </span>
    );
  }
  return (
    <SpinnerRing>
      <span className={cn(status === "pending" && "opacity-40")}>
        {index + 1}
      </span>
    </SpinnerRing>
  );
}

export function StatusPill({ status }: { status: RowStatus }) {
  if (status === "failed") {
    return (
      <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-status-danger-500/10 px-2 font-medium text-[11.5px] text-status-danger-600 dark:text-status-danger-300">
        Failed
        <RotateCwIcon className="size-3 animate-spin [animation-duration:1200ms]" />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="inline-flex h-[22px] items-center rounded-full bg-status-success-500/10 px-2 font-medium text-[11.5px] text-status-success-600 dark:text-status-success-300">
        Completed
      </span>
    );
  }
  return null;
}
