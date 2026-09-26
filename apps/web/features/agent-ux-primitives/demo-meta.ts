import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const agentUxPrimitivesDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "indigo",
    ascii: [
      "╭────────────╮",
      "│ ╭────────╮ │",
      "│ │ ··  ▶ │ │",
      "│ ╰────────╯ │",
      "│ ◇─◇─◇  ▮▮ │",
      "╰────────────╯",
    ].join("\n"),
    label: "UX primitives",
  },
  href: "/demos/agent-ux-primitives",
  pattern: "generative-ui",
  slug: "agent-ux-primitives",
  source: "original/beautifului-inspired",
  publishedAt: "2026-09-26T10:00:00+08:00",
  status: "ready",
  summary:
    "A copyable showcase of all 19 beautifului.dev-inspired agent-UX primitives — from prompt bar, thinking trace, and streaming text to tables, nav, search, and selection actions — implemented on our ai-elements and shadcn base.",
  title: "Agent UX Primitives",
};
