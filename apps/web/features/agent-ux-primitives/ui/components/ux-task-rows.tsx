"use client";

import { cn } from "@workspace/ui/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROWS, statusFor, TICK_MS } from "./ux-task-rows-data";
import { StatusBadge, StatusPill } from "./ux-task-rows-parts";

/**
 * UxTaskRows — a stack of agent task rows that play a scripted run once.
 *
 * Interaction patterns recreated here:
 * - Rows enter staggered on mount.
 * - Mid-run, the active row expands to reveal its detail steps (the same
 *   collapse grammar as the thinking trace); every row stays clickable
 *   to expand afterwards.
 * - The last row walks pending → failed (retry affordance) → done.
 * - "Replay" restarts the timeline, the way a demo harness would.
 *
 * Driven by local state + a timeout chain — no backend. Row data and the
 * tick → status mapping live in `./ux-task-rows-data.ts`; status badges
 * and pills live in `./ux-task-rows-parts.tsx`.
 */

export function UxTaskRows({ className }: { className?: string }) {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (tick >= TICK_MS.length) {
      return;
    }
    timerRef.current = window.setTimeout(
      () => setTick((t) => t + 1),
      TICK_MS[tick]
    );
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [tick]);

  const replay = useCallback(() => {
    setManualOpen({});
    setTick(0);
  }, []);

  return (
    <div className={cn("flex w-full max-w-md flex-col gap-2", className)}>
      {ROWS.map((row, i) => {
        const status = statusFor(row.id, tick);
        const open = manualOpen[row.id] ?? (row.id === "index" && tick === 2);
        return (
          <div
            className="self-stretch overflow-hidden rounded-xl border bg-background transition-all duration-500"
            key={row.id}
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(6px)",
              transitionDelay: `${i * 80}ms`,
            }}
          >
            <button
              aria-expanded={open}
              className="flex h-11 w-full items-center gap-2.5 px-2.5 text-left transition-colors hover:bg-muted/60"
              onClick={() =>
                setManualOpen((current) => ({
                  ...current,
                  [row.id]: !open,
                }))
              }
              type="button"
            >
              <StatusBadge index={i} status={status} />
              <span className="min-w-0 flex-1 truncate font-medium text-[13px] text-foreground">
                {row.label}
              </span>
              <span className="text-[12.5px] text-muted-foreground tabular-nums">
                {row.amount}
              </span>
              <StatusPill status={status} />
              <ChevronDownIcon
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground transition-transform duration-300",
                  open && "rotate-180"
                )}
              />
            </button>
            <div
              className="grid transition-[grid-template-rows,opacity] duration-300"
              style={{
                gridTemplateRows: open ? "1fr" : "0fr",
                opacity: open ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="mb-2.5 grid grid-cols-[24px_1fr] gap-2.5 px-2.5">
                  <span aria-hidden className="mx-auto h-full w-px bg-border" />
                  <div className="flex flex-col gap-1.5">
                    {row.details.map((detail) => (
                      <div
                        className="flex items-center justify-between"
                        key={detail.label}
                      >
                        <span className="text-[12px] text-muted-foreground">
                          {detail.label}
                        </span>
                        <span className="font-mono text-[11.5px] text-muted-foreground/70 tabular-nums">
                          {detail.meta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex justify-end pt-1">
        <button
          className="text-[11.5px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={replay}
          type="button"
        >
          Replay run
        </button>
      </div>
    </div>
  );
}
