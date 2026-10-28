import type { ReactNode } from "react";
import { PageText } from "@/components/page-copy";

/**
 * Option set for UxRecommendationCard — bodies carry inline code chips,
 * so this module stays .tsx.
 */

export interface UxRecommendationOption {
  body: ReactNode;
  cta: string;
  id: string;
  label: string;
  short: string;
  /** 0–3 filled bars on the confidence meter */
  signal: number;
  /** Tailwind class for the filled meter bars */
  toneClass: string;
}

const INLINE_CODE =
  "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground";

export const OPTIONS: [UxRecommendationOption, ...UxRecommendationOption[]] = [
  {
    body: (
      <>
        <PageText>{"Reorder waffle cones from "}</PageText>
        <code className={INLINE_CODE}>cone_king</code>
        <PageText> </PageText>
        <PageText>{"with lead time "}</PageText>
        <code className={INLINE_CODE}>7_days</code>.
      </>
    ),
    cta: "Accept",
    id: "high",
    label: "High confidence",
    short: "Reorder from cone_king · 7-day lead",
    signal: 3,
    toneClass: "bg-status-success-500",
  },
  {
    body: (
      <>
        <PageText>{"Switch vanilla to"}</PageText>
        <PageText> </PageText>
        <code className={INLINE_CODE}>vanilla_madagascar</code>
        <PageText>{" for peak season."}</PageText>
      </>
    ),
    cta: "Configure",
    id: "review",
    label: "Needs review",
    short: "Switch to vanilla_madagascar",
    signal: 2,
    toneClass: "bg-status-warning-500",
  },
  {
    body: (
      <>
        <PageText>{"Fall back to a "}</PageText>
        <span className="font-medium">
          <PageText>{"full restock"}</PageText>
        </span>
        <PageText>{" across every SKU."}</PageText>
      </>
    ),
    cta: "Accept full restock",
    id: "none",
    label: "No signal",
    short: "Full restock across every SKU",
    signal: 0,
    toneClass: "bg-muted-foreground/50",
  },
];
