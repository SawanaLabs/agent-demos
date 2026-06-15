import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const generativeUiDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "rose",
    ascii: [
      "+----------------------------------------+",
      "|                                        |",
      "|        .------------.   .------.       |",
      "|        |  <>  <>   |-->|  []  |       |",
      "|        |  <>  <>   |   |  []  |       |",
      "|        '------------'   '------'       |",
      "|               |              |         |",
      "|               v              v         |",
      "|        .------------.   .------.       |",
      "|        |  ::  ::   |   |  ##  |       |",
      "|        |  ::  ::   |   |  ##  |       |",
      "|        '------------'   '------'       |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "UI tools",
  },
  href: "/demos/generative-ui",
  pattern: "generative-ui",
  slug: "generative-ui",
  source: "AI SDK UI Generative User Interfaces guide",
  status: "ready",
  summary:
    "A chat workspace where the model can use hosted web search when recency matters, then choose a comparison matrix or recommendation card as the primary UI output.",
  title: "Generative UI",
};
