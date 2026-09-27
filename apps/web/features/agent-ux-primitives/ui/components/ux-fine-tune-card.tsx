"use client";

import { Slider } from "@workspace/ui/components/slider";
import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

/**
 * UxFineTuneCard — a compact inspector that edits a live preview.
 *
 * Interaction patterns recreated here:
 * - Slider rows (Radius, Opacity) scrub the preview chip in real time —
 *   the value readout sits beside the label in tabular figures.
 * - Once any control leaves its default, the header flips from an
 *   "Adjust" affordance to an "Edited" confirmation.
 * - Reset restores the pristine state.
 *
 * Built on the shared Slider primitive — local state only, no backend.
 */

const DEFAULTS = { opacity: 100, radius: 28 };

function SliderRow({
  label,
  max,
  onChange,
  value,
}: {
  label: string;
  max: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-14 shrink-0 text-[12px] text-muted-foreground">
        {label}
      </span>
      <Slider
        aria-label={label}
        className="min-w-0 flex-1"
        max={max}
        onValueChange={(next) =>
          onChange(typeof next === "number" ? next : (next[0] ?? 0))
        }
        value={value}
      />
      <span className="w-9 shrink-0 text-right font-mono text-[11.5px] text-muted-foreground tabular-nums">
        {value}%
      </span>
    </div>
  );
}

export function UxFineTuneCard({ className }: { className?: string }) {
  const [radius, setRadius] = useState(DEFAULTS.radius);
  const [opacity, setOpacity] = useState(DEFAULTS.opacity);
  const edited = radius !== DEFAULTS.radius || opacity !== DEFAULTS.opacity;

  return (
    <div
      className={cn(
        "w-full max-w-60 overflow-hidden rounded-xl border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="font-medium text-[13px] text-foreground">
          Flavor card
        </span>
        {edited ? (
          <span className="flex items-center gap-1.5 font-medium text-[12px] text-status-success-600 dark:text-status-success-300">
            <CheckIcon className="size-3" />
            Edited
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-medium text-[12px] text-muted-foreground">
            <SparklesIcon className="size-3" />
            Adjust
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 border-b px-3 py-2.5">
        <p className="font-medium text-[12.5px] text-foreground">Layout</p>
        <SliderRow
          label="Radius"
          max={64}
          onChange={setRadius}
          value={radius}
        />
        <SliderRow
          label="Opacity"
          max={100}
          onChange={setOpacity}
          value={opacity}
        />
      </div>

      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[12px] text-muted-foreground">Preview</span>
        {edited ? (
          <button
            className="text-[11.5px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={() => {
              setRadius(DEFAULTS.radius);
              setOpacity(DEFAULTS.opacity);
            }}
            type="button"
          >
            Reset
          </button>
        ) : null}
      </div>
      <div className="grid place-items-center bg-muted/40 px-3 pb-3">
        <div
          className="grid h-16 w-full place-items-center border bg-card shadow-sm transition-[border-radius,opacity] duration-150"
          style={{ borderRadius: radius, opacity: opacity / 100 }}
        >
          <span className="font-medium text-[11px] text-muted-foreground">
            {radius}px · {opacity}%
          </span>
        </div>
      </div>
    </div>
  );
}
