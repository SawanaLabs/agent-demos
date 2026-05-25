import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const persistentAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "amber",
    label: "Persistent chat",
    steps: ["Route", "Store", "Resume"],
  },
  href: "/demos/persistent-agent",
  pattern: "foundation",
  slug: "persistent-agent",
  source: "AI SDK UI message persistence and resume streams",
  status: "ready",
  summary:
    "A URL-backed agent chat that persists messages in Postgres, isolates visitors with an HTTP-only cookie, and resumes live streams after refresh.",
  title: "Persistent Agent",
};
