import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const contentReviewDemoMeta: DemoCatalogEntry = {
  slug: "content-review",
  title: "Object Generation",
  summary:
    "Stream a structured moderation-style review object from text, images, and PDFs, then render that object directly inside the assistant message.",
  pattern: "structured-output",
  status: "ready",
  source: "AI SDK 6 structured output and useObject docs",
  href: "/demos/content-review",
};
