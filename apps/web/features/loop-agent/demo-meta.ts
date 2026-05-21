import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const loopAgentDemoMeta: DemoCatalogEntry = {
  slug: "loop-agent",
  title: "Loop Agent",
  summary:
    "A visible multi-step agent loop that shows tool calling, stopping rules, and the contrast between simple tools and agent control.",
  pattern: "loop",
  status: "roadmap",
  source: "AI SDK 6 tool and agent loop examples",
};
