import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const ragChatbotDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "amber",
    label: "Knowledge base",
    steps: ["Ingest", "Retrieve", "Ground"],
  },
  slug: "rag-chatbot",
  title: "RAG Chatbot",
  summary:
    "Knowledge-base ingestion and retrieval over durable storage, following the stable AI SDK recipe with a productized workspace.",
  pattern: "rag",
  status: "ready",
  source: "AI SDK 6 stable RAG recipe",
  href: "/demos/rag-chatbot",
};
