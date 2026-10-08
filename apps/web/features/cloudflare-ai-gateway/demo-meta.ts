import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const cloudflareAiGatewayDemoMeta: DemoCatalogEntry = {
  slug: "cloudflare-ai-gateway",
  title: "Cloudflare AI Gateway",
  summary:
    "Generate and edit images with GPT Image 2 or Gemini 3.1 Flash Image through Cloudflare's native provider routes.",
  pattern: "multimodal",
  status: "ready",
  publishedAt: "2026-10-08T18:00:00+08:00",
  source: "Cloudflare provider-native routes and AI SDK 6 image generation",
  href: "/demos/cloudflare-ai-gateway",
  galleryVisual: {
    accent: "amber",
    label: "Image gateway",
    ascii:
      "+--------------------------+\n|  [:::]       [o]  [o]    |\n|      \\       /  /       |\n|       +-----+---+        |\n|       | / / / / |        |\n|       +----+----+        |\n|         /     \\          |\n|     +--+       +--+      |\n|     |@@|       |##|      |\n+--------------------------+",
  },
};
