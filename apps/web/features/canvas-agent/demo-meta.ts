import type { DemoCatalogEntry } from "@/features/demo-catalog/types";
export const canvasAgentDemoMeta: DemoCatalogEntry = {
  slug: "canvas-agent",
  title: "Canvas Agent",
  href: "/demos/canvas-agent",
  pattern: "tools",
  source: "Original demo",
  status: "ready",
  publishedAt: "2026-09-20T20:00:00+08:00",
  summary:
    "Compose branching text and image workflows on an infinite canvas. Ask the agent to edit the graph, run generation, and reuse results in the next step.",
  galleryVisual: {
    accent: "cyan",
    label: "Canvas and conversation",
    ascii: [
      "        [ ======== ]",
      "             /     \\",
      "      [ //// ]   [ //// ]",
      "           \\      /",
      "          [ ###### ]",
      "",
      "      > ...................",
    ].join("\n"),
  },
};
