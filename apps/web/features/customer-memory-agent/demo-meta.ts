import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const customerMemoryAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "emerald",
    label: "Memory loop",
    steps: ["Chat", "Store", "Recall"],
  },
  slug: "customer-memory-agent",
  title: "Memory & Persistence Agent",
  summary:
    "Persist chat threads, explicit memory-tool writes, and handoff compactions so an agent can resume work across sessions.",
  pattern: "tools",
  status: "ready",
  source: "AI SDK memory, persistence, and embeddings docs",
  href: "/demos/customer-memory-agent",
};
