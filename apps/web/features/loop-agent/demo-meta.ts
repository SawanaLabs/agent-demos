import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const loopAgentDemoMeta: DemoCatalogEntry = {
  slug: "loop-agent",
  title: "Loop Agent",
  summary:
    "A support triage agent that shows parallel context lookup, dependent SLA checks, visible tool state, and bounded loop control.",
  pattern: "loop",
  status: "ready",
  source: "AI SDK 6 stable tool-calling and loop-control recipes",
  href: "/demos/loop-agent",
};
