"use client";

import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import {
  OPTIONS,
  type UxRecommendationOption,
} from "./ux-recommendation-card-data";

/**
 * UxRecommendationCard — an agent recommendation with a confidence meter.
 *
 * Interaction patterns recreated here:
 * - The headline option carries a 3-bar signal meter, a confidence label,
 *   and a single primary CTA that resolves in place to "Accepted".
 * - "Alternatives" opens a drawer inside the card listing the other
 *   options with their own meters; picking one promotes it to the
 *   recommendation slot without moving the card.
 * - Body copy swaps on selection — the card holds its shape.
 *
 * Local state only — no backend. The option set lives in
 * `./ux-recommendation-card-data.tsx`.
 */

const BAR_HEIGHTS = [4, 7, 10];

function SignalMeter({
  signal,
  toneClass,
}: {
  signal: number;
  toneClass: string;
}) {
  return (
    <span className="flex items-end gap-0.5">
      {BAR_HEIGHTS.map((height, bar) => (
        <span
          className={cn(
            "w-1 rounded-full transition-colors duration-300",
            bar < signal ? toneClass : "bg-border"
          )}
          key={bar}
          style={{ height }}
        />
      ))}
    </span>
  );
}

export function UxRecommendationCard({ className }: { className?: string }) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const active: UxRecommendationOption = OPTIONS[selected] ?? OPTIONS[0];
  const others = OPTIONS.map((option, i) => ({ i, option })).filter(
    ({ i }) => i !== selected
  );

  return (
    <div
      className={cn(
        "w-full max-w-sm overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className="p-3.5">
        <span className="font-semibold text-[13px] text-foreground">
          Want me to place this restock order?
        </span>
        <p
          className="mt-1.5 min-h-12 text-[13px] text-muted-foreground leading-relaxed"
          key={active.id}
        >
          {active.body}
        </p>
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="border-t bg-muted/40 px-2 py-2">
            <p className="px-1.5 pb-1 font-medium text-[11px] text-muted-foreground">
              Other options
            </p>
            {others.map(({ i, option }) => (
              <button
                className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-muted"
                key={option.id}
                onClick={() => {
                  setSelected(i);
                  setAccepted(false);
                  setOpen(false);
                }}
                type="button"
              >
                <SignalMeter
                  signal={option.signal}
                  toneClass={option.toneClass}
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-foreground">
                  {option.short}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-3.5 py-2.5">
        <span className="flex items-center gap-2">
          <SignalMeter signal={active.signal} toneClass={active.toneClass} />
          <span className="font-medium text-[12.5px] text-muted-foreground">
            {active.label}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <button
            aria-expanded={open}
            className={cn(
              "h-7 rounded-md border bg-card px-2.5 font-medium text-[12.5px] transition-colors hover:bg-muted",
              open && "bg-muted"
            )}
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            Alternatives
          </button>
          <button
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md px-3 font-medium text-[12.5px] transition-colors",
              accepted
                ? "bg-status-success-600 text-background"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => setAccepted(true)}
            type="button"
          >
            {accepted ? (
              <>
                <CheckIcon className="size-3.5" />
                Accepted
              </>
            ) : (
              active.cta
            )}
          </button>
        </span>
      </div>
    </div>
  );
}
