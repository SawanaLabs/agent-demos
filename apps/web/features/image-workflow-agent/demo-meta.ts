import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const imageWorkflowAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "indigo",
    ascii: [
      "+----------------------------------------+",
      "| .--------.   .------------.   .------. |",
      "| |  <>    |-->|  ////      |-->|  ##  | |",
      "| |  []    |   |  ====      |   |  ##  | |",
      "| '--------'   |  ....      |   '------' |",
      "|              '------------'            |",
      "|                                        |",
      "|  [ + ] [ o ] [ ~ ] [ > ]               |",
      "|                                        |",
      "|  ::::::::::::::::::::::::::::::::::::  |",
      "|  ....................................  |",
      "|  ================================:::  |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Workflow canvas",
  },
  href: "/demos/image-workflow-agent",
  pattern: "tools",
  slug: "image-workflow-agent",
  source: "Original demo",
  status: "ready",
  summary:
    "A canvas-first image workflow demo where users and the agent both mutate the same validated graph, then run either prompt-only generation or reference-image editing.",
  title: "Image Workflow Agent",
};
