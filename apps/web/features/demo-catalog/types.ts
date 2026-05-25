export const demoPatterns = [
  "foundation",
  "rag",
  "loop",
  "tools",
  "skills",
  "sandbox",
  "multimodal",
  "structured-output",
  "mcp",
  "generative-ui",
] as const;

export type DemoPattern = (typeof demoPatterns)[number];

export const demoStatuses = ["ready", "roadmap"] as const;

export type DemoStatus = (typeof demoStatuses)[number];

export interface DemoGalleryVisual {
  accent: "amber" | "cyan" | "emerald" | "indigo" | "rose" | "sky" | "violet";
  ascii?: string;
  label: string;
}

interface DemoCatalogEntryBase {
  galleryVisual: DemoGalleryVisual;
  pattern: DemoPattern;
  slug: string;
  source: string;
  summary: string;
  title: string;
}

export interface ReadyDemoCatalogEntry extends DemoCatalogEntryBase {
  href: `/demos/${string}`;
  status: "ready";
}

export interface RoadmapDemoCatalogEntry extends DemoCatalogEntryBase {
  status: "roadmap";
}

export type DemoCatalogEntry = ReadyDemoCatalogEntry | RoadmapDemoCatalogEntry;

export function isReadyDemoCatalogEntry(
  entry: DemoCatalogEntry
): entry is ReadyDemoCatalogEntry {
  return entry.status === "ready";
}
