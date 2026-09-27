"use client";

import { cn } from "@workspace/ui/lib/utils";
import { ArrowUpRightIcon, ListIcon } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * UxContextCards — retrieved knowledge chunks for a RAG-style answer.
 *
 * Interaction patterns recreated here:
 * - A header row summarizes the retrieval ("All chunks · N").
 * - Each chunk card enters staggered: title + character count up top,
 *   excerpt below, then a source chip that pops in a beat later —
 *   mirroring how agent UIs reveal citations after the content lands.
 * - Source chips carry a file-type badge (PDF / CSV) and an external
 *   affordance.
 *
 * Local state only — entrance is driven by mount + a single timer.
 */

interface UxContextChunk {
  badge: string;
  badgeClass: string;
  body: string;
  chars: string;
  source: string;
  title: string;
}

const CHUNKS: UxContextChunk[] = [
  {
    badge: "PDF",
    badgeClass: "bg-status-danger-500 text-background",
    body: "Cold-chain certification must be verified before a new dairy can be added to the reorder workflow.",
    chars: "290 characters",
    source: "Dairy Onboarding SOP.pdf",
    title: "Vendor onboarding rule",
  },
  {
    badge: "CSV",
    badgeClass: "bg-status-success-600 text-background",
    body: "Q4 velocity table: pistachio +18%, vanilla +6%, rocky road -11%; retire flavors below 40 scoops weekly.",
    chars: "1,250 characters",
    source: "Sales Velocity Export.csv",
    title: "Seasonal demand row",
  },
];

export function UxContextCards({
  chunks = CHUNKS,
  total = 32,
  className,
}: {
  chunks?: UxContextChunk[];
  className?: string;
  total?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [chipsShown, setChipsShown] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    const timer = window.setTimeout(() => setChipsShown(true), 700);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className={cn("flex w-full max-w-sm flex-col gap-2", className)}>
      <div className="flex items-center gap-2 px-0.5">
        <span className="font-semibold text-[13px] text-foreground">
          All chunks
        </span>
        <span className="inline-flex h-5 items-center rounded-md border bg-muted px-1.5 font-medium text-[11.5px] text-muted-foreground tabular-nums">
          {total}
        </span>
      </div>

      {chunks.map((chunk, i) => (
        <div
          className="overflow-hidden rounded-xl border bg-card transition-all duration-500"
          key={chunk.title}
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(8px)",
            transitionDelay: `${i * 100}ms`,
          }}
        >
          <div className="flex items-center gap-2.5 border-b px-3 py-2">
            <span className="flex min-w-0 items-center gap-1.5 font-medium text-[13px] text-foreground">
              <ListIcon className="size-3 shrink-0" />
              <span className="truncate">{chunk.title}</span>
            </span>
            <span className="ml-auto shrink-0 text-[12px] text-muted-foreground tabular-nums">
              {chunk.chars}
            </span>
          </div>
          <p className="px-3 pt-2 pb-1 text-[12.5px] text-muted-foreground leading-relaxed">
            {chunk.body}
          </p>
          <div className="px-3 pb-3">
            <span
              className={cn(
                "inline-flex h-6 items-center gap-1.5 rounded-full border bg-muted/60 px-2 font-medium text-[12px] text-muted-foreground transition-[opacity,transform] duration-300 hover:bg-muted",
                chipsShown ? "scale-100 opacity-100" : "scale-95 opacity-0"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span
                className={cn(
                  "grid size-3.5 place-items-center rounded-[4px] font-bold text-[7px]",
                  chunk.badgeClass
                )}
              >
                {chunk.badge}
              </span>
              {chunk.source}
              <ArrowUpRightIcon className="size-2.5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
