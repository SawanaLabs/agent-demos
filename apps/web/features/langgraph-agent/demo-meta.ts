import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const langGraphAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "emerald",
    ascii: [
      "+----------------------------------------+",
      "| o o o  ------------------------------ |",
      "|----------------------------------------|",
      "| o----o----o----o                       |",
      "|           |                            |",
      "|           v                            |",
      "|        o----o----o                     |",
      "|                                        |",
      "|  .----.    .----.    .----.           |",
      "|  '----' -> '----' -> '----'           |",
      "|----------------------------------------|",
      "|  [][][][][][][][][][][][][][][][]     |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "LangGraph bridge",
  },
  slug: "langgraph-agent",
  title: "LangGraph Agent",
  summary:
    "A Next.js and AI Elements frontend wired to the official LangGraph thread-scoped Agent Server streaming API.",
  pattern: "langgraph",
  publishedAt: "2026-05-28T16:02:19+08:00",
  status: "ready",
  source: "LangGraph Agent Server API plus AI SDK UI message streams",
  href: "/demos/langgraph-agent",
};
