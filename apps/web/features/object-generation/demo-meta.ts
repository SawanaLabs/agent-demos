import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const objectGenerationDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "indigo",
    ascii: [
      "+----------------------------------------+",
      "|      .--------------------------.      |",
      "|      |  []   []   []   []   []  |      |",
      "|      |--------------------------|      |",
      "|      |  ..........              |      |",
      "|      |  ...............         |      |",
      "|      |  .........    [ ]        |      |",
      "|      |--------------------------|      |",
      "|      |  []  ...............     |      |",
      "|      |  []  ..........          |      |",
      "|      |  []  ..............      |      |",
      "|      |--------------------------|      |",
      "|      |  [ ] [ ] [ ]   ======    |      |",
      "|      '--------------------------'      |",
      "|           []        []        []       |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Structured object",
  },
  slug: "object-generation",
  title: "Object Generation",
  summary:
    "Generate a structured object from text, images, and PDFs, then render that object directly inside the assistant message.",
  pattern: "structured-output",
  status: "ready",
  source: "AI SDK 6 structured output and useObject docs",
  href: "/demos/object-generation",
};
