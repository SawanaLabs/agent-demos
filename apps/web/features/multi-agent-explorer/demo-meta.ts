import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const multiAgentExplorerDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "indigo",
    ascii: [
      "╭─────────╮",
      "│    ◆    │",
      "│  ╱ │ ╲  │",
      "│ ◎  ◎  ◎ │",
      "│  ╲ │ ╱  │",
      "│    ▣    │",
      "╰─────────╯",
    ].join("\n"),
    label: "Lead + fan-out",
  },
  href: "/demos/multi-agent-explorer",
  pattern: "tools",
  slug: "multi-agent-explorer",
  source: "ai-sdk/orchestration",
  publishedAt: "2026-09-26T10:00:00+08:00",
  status: "ready",
  summary:
    "A lead agent decomposes a research question, fans subtopics out to parallel explorer subagents with their own tool loops, then synthesizes a cited report with every hop visible in the stream.",
  title: "Multi-Agent Explorer",
};
