import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const eveAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "violet",
    ascii: [
      "╭───────────╮",
      "│ ┌─think─┐ │",
      "│ ↓       │ │",
      "│ obs   act │",
      "│ └◄──────┘ │",
      "╰───────────╯",
    ].join("\n"),
    label: "Eve agent loop",
  },
  pattern: "loop",
  publishedAt: "2026-09-27T14:00:00+08:00",
  slug: "eve-agent",
  source: "vercel/eve",
  status: "ready",
  href: "/demos/eve-agent",
  summary:
    "A service-triage chat agent on Vercel's eve framework — agent files live in agents/service-triage/ (filesystem-first: agent.ts, instructions.md, tools/), deployed as a peer Vercel service via withEve in vercel.ts, reachable at /eve/service-triage/v1/*.",
  title: "Eve Agent",
};
