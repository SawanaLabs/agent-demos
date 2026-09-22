import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const feedbackAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "emerald",
    label: "Point → capture → triage",
    ascii: "╭────────────╮\n│ ⌖ → ▣ → ✦ │\n│ ▤ ▤ ▤      │\n╰────────────╯",
  },
  href: "/demos/feedback-agent",
  pattern: "multimodal",
  slug: "feedback-agent",
  source: "makethisbetter/makethisbetter-js",
  publishedAt: "2026-09-23T00:00:00+08:00",
  status: "ready",
  summary:
    "Point at a page element, capture annotated screenshots, collect feedback, and turn the evidence into an actionable issue with AI.",
  title: "Feedback Agent",
};
