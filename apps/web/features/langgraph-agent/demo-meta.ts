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
  status: "ready",
  source: "LangGraph Agent Server API plus AI SDK UI message streams",
  href: "/demos/langgraph-agent",
};
