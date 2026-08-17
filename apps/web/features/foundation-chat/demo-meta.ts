import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const foundationChatDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "sky",
    ascii: [
      "+----------------------------------------+",
      "| o o o  --------------                  |",
      "|----------------------------------------|",
      "|  .--------.                            |",
      "|  | ...... |             .------------. |",
      "|  '--------'             | .......... | |",
      "|                         '------.-----' |",
      "|      .--------------.          |       |",
      "|      | ............ |          |       |",
      "|      '--------------'    .-----'       |",
      "|  .-----------.                         |",
      "|  | ......... |              _          |",
      "|----------------------------------------|",
      "|  >_ [][][][][]                         |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Base chat",
  },
  slug: "foundation-chat",
  title: "Foundation Chat",
  summary:
    "A production-ready base chat wired to AI Gateway and AI SDK 6, built as the copyable starting point for future demos.",
  pattern: "foundation",
  publishedAt: "2026-05-22T00:04:11+08:00",
  status: "ready",
  source: "AI SDK 6 stable runtime contract",
  href: "/demos/foundation-chat",
};
