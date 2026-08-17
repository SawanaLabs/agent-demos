import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const ragChatbotDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "amber",
    ascii: [
      "+----------------------------------------+",
      "| .----.  .----.                         |",
      "| |....|  |....|        .------------.   |",
      "| |....|  |....|  --->  | . . . . .  |   |",
      "| '----'  '----'        | . . . . .  |   |",
      "|    .----.             '-----+------'   |",
      "|    |....|                   |          |",
      "|    '----'               .---+---.      |",
      "|                         |  ( )  |      |",
      "|   .--------------.      |  ---  |      |",
      "|   | . . . . . .  +------+   |   |      |",
      "|   '--------------'          |          |",
      "|                         .---+------.   |",
      "|                         |  ......  |   |",
      "|                         '----------'   |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Knowledge base",
  },
  slug: "rag-chatbot",
  title: "RAG Chatbot",
  summary:
    "Knowledge-base ingestion and retrieval over durable storage, following the stable AI SDK recipe with a productized workspace.",
  pattern: "rag",
  publishedAt: "2026-05-22T00:35:40+08:00",
  status: "ready",
  source: "AI SDK 6 stable RAG recipe",
  href: "/demos/rag-chatbot",
};
