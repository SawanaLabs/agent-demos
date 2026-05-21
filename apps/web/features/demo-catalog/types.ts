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

export interface DemoCatalogEntry {
  href?: string;
  pattern: DemoPattern;
  slug: string;
  source: string;
  status: DemoStatus;
  summary: string;
  title: string;
}
