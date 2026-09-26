"use client";

import { cn } from "@workspace/ui/lib/utils";

/**
 * UxInsightCards — headline metrics with inline sparklines.
 *
 * Interaction patterns recreated here:
 * - Each card pairs a headline metric and a signed delta with a tiny
 *   inline sparkline drawn from the same data — the shape does the
 *   talking, no axes.
 * - Delta color and sparkline stroke share one status token per card.
 *
 * The sparkline is a hand-drawn SVG polyline (no chart dependency);
 * everything renders statically — no backend.
 */

interface InsightCard {
  data: number[];
  delta: string;
  dotClass: string;
  label: string;
  metric: string;
  sub: string;
  toneClass: string;
}

const CARDS: InsightCard[] = [
  {
    data: [-2.9, -3.4, -3.05, -3.86, -3.52, -4.1, -3.82, -4.41],
    delta: "-4.41%",
    dotClass: "bg-status-warning-500",
    label: "Mint Chip return",
    metric: "-$2,377.66",
    sub: "vs last summer",
    toneClass: "text-status-danger-600 dark:text-status-danger-300",
  },
  {
    data: [0.22, 0.58, 0.42, 0.91, 0.76, 1.08, 0.96, 1.15],
    delta: "+1.15%",
    dotClass: "bg-status-success-500",
    label: "Pistachio return",
    metric: "+$617.22",
    sub: "vs last summer",
    toneClass: "text-status-success-600 dark:text-status-success-300",
  },
  {
    data: [274, 289, 264, 307, 331, 1210, 1718, 2112],
    delta: "+$1,834.66",
    dotClass: "bg-status-danger-500",
    label: "Freezer spend",
    metric: "$2,112",
    sub: "vs 3 months",
    toneClass: "text-status-warning-600 dark:text-status-warning-300",
  },
];

const SPARK_WIDTH = 96;
const SPARK_HEIGHT = 28;
const SPARK_PAD = 2;

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, i) => {
      const x =
        SPARK_PAD + (i / (data.length - 1)) * (SPARK_WIDTH - SPARK_PAD * 2);
      const y =
        SPARK_PAD +
        (1 - (value - min) / range) * (SPARK_HEIGHT - SPARK_PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = data.at(-1);
  const lastY =
    SPARK_PAD +
    (1 - ((last ?? 0) - min) / range) * (SPARK_HEIGHT - SPARK_PAD * 2);

  return (
    <svg
      aria-hidden
      className="h-7 w-24 shrink-0"
      fill="none"
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
    >
      <title>Sparkline</title>
      <polyline
        points={points}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle
        cx={SPARK_WIDTH - SPARK_PAD}
        cy={lastY}
        fill="currentColor"
        r="2.2"
      />
    </svg>
  );
}

export function UxInsightCards({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full max-w-sm flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-0.5">
        <span className="font-semibold text-[13px] text-foreground">
          Insights
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {CARDS.length} trends
        </span>
      </div>
      {CARDS.map((card) => (
        <div
          className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5"
          key={card.label}
        >
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <span className={cn("size-2 rounded-full", card.dotClass)} />
              {card.label}
            </span>
            <span className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-semibold text-[15px] text-foreground tabular-nums tracking-tight">
                {card.metric}
              </span>
              <span
                className={cn(
                  "font-mono text-[11px] tabular-nums",
                  card.toneClass
                )}
              >
                {card.delta}
              </span>
            </span>
            <span className="block text-[10.5px] text-muted-foreground">
              {card.sub}
            </span>
          </div>
          <span className={card.toneClass}>
            <Sparkline data={card.data} />
          </span>
        </div>
      ))}
    </div>
  );
}
