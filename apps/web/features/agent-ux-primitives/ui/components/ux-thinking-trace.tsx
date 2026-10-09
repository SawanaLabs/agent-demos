"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import {
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  LoaderIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * UxThinkingTrace — an expandable chain-of-thought trace.
 *
 * Interaction patterns recreated here:
 * - Steps append one at a time while the trace is "live"; each shows its
 *   own elapsed time once it finishes and a spinner while running.
 * - The header collapses the whole trace into a single summary line
 *   ("Thought for Ns") once finished, mirroring the way reasoning UIs
 *   fold away after streaming completes.
 * - Users can expand the trace at any point to inspect individual steps;
 *   each step shows its own duration and status icon.
 *
 * Driven by local state + timers only — no backend. Pass `autoPlay` to
 * replay the canned sequence, or feed `steps` for a static render.
 */

export interface UxThinkingStep {
  detail?: string;
  /** milliseconds the step took; undefined while still running */
  elapsedMs?: number;
  id: string;
  label: string;
  status: "pending" | "running" | "done";
}

interface UxThinkingTraceProps {
  autoPlay?: boolean;
  className?: string;
  defaultOpen?: boolean;
  onReset?: () => void;
  /** Scripted steps to replay when autoPlay is on. */
  script?: Array<
    Omit<UxThinkingStep, "status" | "elapsedMs"> & { durationMs: number }
  >;
  /** Static steps for a fully-controlled render. */
  steps?: UxThinkingStep[];
}

const defaultScript: Array<
  Omit<UxThinkingStep, "status" | "elapsedMs"> & { durationMs: number }
> = [
  {
    detail: "2 goals, 1 constraint",
    durationMs: 900,
    id: "parse",
    label: "Parse the request",
  },
  {
    detail: "docs.example.com, README.md",
    durationMs: 1400,
    id: "gather",
    label: "Gather context sources",
  },
  {
    detail: "ranked 6 candidates",
    durationMs: 1100,
    id: "rank",
    label: "Rank candidate tools",
  },
  {
    detail: "ready to answer",
    durationMs: 700,
    id: "draft",
    label: "Draft response outline",
  },
];

const stepIcons: Record<UxThinkingStep["status"], React.ReactNode> = {
  done: <CheckIcon className="size-3" />,
  pending: <CircleDashedIcon className="size-3 text-muted-foreground/60" />,
  running: <LoaderIcon className="size-3 animate-spin" />,
};

function formatElapsed(ms?: number) {
  if (ms === undefined) {
    return "";
  }
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function UxThinkingTrace({
  steps: controlledSteps,
  script = defaultScript,
  autoPlay = true,
  defaultOpen,
  className,
  onReset,
}: UxThinkingTraceProps) {
  const [simulatedSteps, setSimulatedSteps] = useState<UxThinkingStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen ?? true);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const runScript = useCallback(() => {
    clearTimers();
    setSimulatedSteps([]);
    setIsRunning(true);
    setIsOpen(true);

    let cursor = 0;
    script.forEach((step, index) => {
      const startTimer = window.setTimeout(() => {
        setSimulatedSteps((current) => [
          ...current,
          { ...step, status: "running" },
        ]);
      }, cursor);
      timersRef.current.push(startTimer);
      cursor += step.durationMs;

      const doneTimer = window.setTimeout(() => {
        setSimulatedSteps((current) =>
          current.map((item) =>
            item.id === step.id
              ? { ...item, elapsedMs: step.durationMs, status: "done" }
              : item
          )
        );
        if (index === script.length - 1) {
          setIsRunning(false);
        }
      }, cursor);
      timersRef.current.push(doneTimer);
    });
  }, [script, clearTimers]);

  useEffect(() => {
    if (autoPlay && !controlledSteps) {
      runScript();
    }
    return clearTimers;
  }, [autoPlay, controlledSteps, runScript, clearTimers]);

  const steps = controlledSteps ?? simulatedSteps;
  const finished = !isRunning && steps.every((step) => step.status === "done");
  const totalMs = steps.reduce((sum, step) => sum + (step.elapsedMs ?? 0), 0);

  return (
    <Collapsible
      className={cn("rounded-lg border bg-muted/30", className)}
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2 text-left">
        <BrainIcon className="size-3.5 text-muted-foreground" />
        <span className="flex-1 text-[13px]">
          {(() => {
            if (isRunning) {
              return (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  Thinking
                  <span className="inline-flex gap-0.5">
                    <span className="size-1 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:0ms]" />
                    <span className="size-1 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:150ms]" />
                    <span className="size-1 animate-pulse rounded-full bg-muted-foreground/70 [animation-delay:300ms]" />
                  </span>
                </span>
              );
            }
            if (finished) {
              return (
                <span className="text-muted-foreground">
                  Thought for {formatElapsed(totalMs) || "a moment"}
                </span>
              );
            }
            return (
              <span className="text-muted-foreground">Thinking trace</span>
            );
          })()}
        </span>
        {!isRunning && onReset ? (
          <button
            className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              onReset();
            }}
            type="button"
          >
            Replay
          </button>
        ) : null}
        <ChevronDownIcon
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="space-y-0.5 border-t px-3 py-2">
          {steps.map((step) => (
            <li
              className="flex items-center gap-2 py-0.5 text-[12.5px]"
              key={step.id}
            >
              <span className="grid size-4 shrink-0 place-items-center">
                {stepIcons[step.status]}
              </span>
              <span
                className={cn(
                  step.status === "pending" && "text-muted-foreground/60",
                  step.status === "running" && "text-foreground",
                  step.status === "done" && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.detail && step.status !== "pending" ? (
                <span className="truncate text-[11px] text-muted-foreground/70">
                  {step.detail}
                </span>
              ) : null}
              <span className="ml-auto font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                {formatElapsed(step.elapsedMs)}
              </span>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
