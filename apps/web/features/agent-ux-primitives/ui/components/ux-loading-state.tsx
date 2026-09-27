"use client";

import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useState } from "react";

/**
 * UxLoadingState — a pixel-grid loader for long-running agent work.
 *
 * Interaction patterns recreated here:
 * - A 3x3 pixel grid pulses on a wavefront: `drive` sweeps a chevron
 *   left-to-right, `dots` runs the same wavefront on round cells, and
 *   `orbit` laps a single bright pixel around the perimeter (center
 *   stays dark).
 * - The label shimmers via the shared ai-elements Shimmer primitive.
 * - A live elapsed timer in mono tabular figures ticks beside the label.
 *
 * Driven by Tailwind's built-in `animate-pulse` with per-cell delay and
 * duration — no custom keyframes. Local state only — no backend.
 */

export type UxLoadingVariant = "drive" | "dots" | "orbit";

interface UxLoadingStateProps {
  className?: string;
  label?: string;
  variant?: UxLoadingVariant;
}

// Cell index → animation delay. The chevron front sweeps right by
// column, offset by distance from the middle row; orbit delays follow
// the perimeter path and leave the center cell dark.
const chevronDelays = Array.from({ length: 9 }, (_, i) => {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return (col + Math.abs(row - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbitDelays = Array.from({ length: 9 }, (_, i) => {
  const step = ORBIT_ORDER.indexOf(i);
  return step === -1 ? null : step * 110;
});

const PATTERNS: Record<
  UxLoadingVariant,
  { delays: Array<number | null>; durationMs: number; round: boolean }
> = {
  dots: { delays: chevronDelays, durationMs: 650, round: true },
  drive: { delays: chevronDelays, durationMs: 650, round: false },
  orbit: { delays: orbitDelays, durationMs: 950, round: false },
};

function useElapsedTime() {
  const [tenths, setTenths] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTenths((t) => t + 1), 100);
    return () => window.clearInterval(timer);
  }, []);
  const total = tenths / 10;
  if (total < 60) {
    return `${total.toFixed(1)}s`;
  }
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

export function UxLoadingState({
  label = "Churning",
  variant = "drive",
  className,
}: UxLoadingStateProps) {
  const elapsed = useElapsedTime();
  const pattern = PATTERNS[variant];

  return (
    <div className={cn("flex w-fit items-center gap-2.5", className)}>
      <span aria-hidden className="grid grid-cols-3 gap-[1.5px]">
        {pattern.delays.map((delay, i) => (
          <span
            className={cn(
              "size-1 bg-foreground",
              pattern.round ? "rounded-full" : "rounded-[1px]",
              delay === null ? "opacity-[0.07]" : "animate-pulse"
            )}
            key={i}
            style={
              delay === null
                ? undefined
                : {
                    animationDelay: `${delay}ms`,
                    animationDuration: `${pattern.durationMs}ms`,
                  }
            }
          />
        ))}
      </span>
      <Shimmer as="span" className="font-medium text-[13px]" duration={1.4}>
        {label}
      </Shimmer>
      <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
        {elapsed}
      </span>
    </div>
  );
}
