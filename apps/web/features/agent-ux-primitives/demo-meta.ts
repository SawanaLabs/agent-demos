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
    "A copyable showcase of agent-UX primitives — interactive prompt bar, thinking trace, streaming text, tool-call chips, approval card, task rows, context cards, and a pixel loader — implemented on our ai-elements and shadcn base with beautifului.dev-inspired interaction patterns.",
  title: "Agent UX Primitives",
};
