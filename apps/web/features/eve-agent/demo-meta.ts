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
  slug: "eve-agent",
  source: "vercel/eve",
  status: "roadmap",
  summary:
    "WIP: a service-triage chat agent on Vercel's eve framework (beta) that looks up services, checks region health, and answers through the eve agent loop. The slice, route, and workspace are complete; the eve package install and adapter verification are pending.",
  title: "Eve Agent",
};
