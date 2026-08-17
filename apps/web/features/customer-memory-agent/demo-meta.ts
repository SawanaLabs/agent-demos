import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const customerMemoryAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "emerald",
    ascii: [
      "+----------------------------------------+",
      "|     .--------. .--------. .--------.   |",
      "|     |  .--.  | |  .--.  | |  .--.  |   |",
      "|     | (....) | | (....) | | (....) |   |",
      "|     |  '--'  | |  '--'  | |  '--'  |   |",
      "|     |--------| |--------| |--------|   |",
      "|     | ------ | | ------ | | ------ |   |",
      "|     | ----   | | ----   | | ----   |   |",
      "|     | ----   | | ----   | | ----   |   |",
      "|     |  [] [] | |  [] [] | |  [] [] |   |",
      "|     '--------' '--------' '--------'   |",
      "|        .--.        .--.        .--.    |",
      "|       (....)      (....)      (....)   |",
      "|        '--'        '--'        '--'    |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Memory loop",
  },
  slug: "customer-memory-agent",
  title: "Memory & Persistence Agent",
  summary:
    "Persist chat threads, explicit memory-tool writes, and handoff compactions so an agent can resume work across sessions.",
  pattern: "tools",
  publishedAt: "2026-05-24T14:58:27+08:00",
  status: "ready",
  source: "AI SDK memory, persistence, and embeddings docs",
  href: "/demos/customer-memory-agent",
};
