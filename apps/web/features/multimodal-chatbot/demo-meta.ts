import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const multimodalChatbotDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "violet",
    ascii: [
      "+----------------------------------------+",
      "| .----------------.   .--------------.  |",
      "| |      .--.      |   |\\             |  |",
      "| |     /    \\     |   | \\  ......... |  |",
      "| |    / /\\   \\    |   |  \\ ........ |   |",
      "| |   /_/  \\___\\   |   |   \\....... |    |",
      "| |  ~~~~~~~~~~~~  |   |------------  |  |",
      "| |  ~~~    ~~~~~  |   |------------  |  |",
      "| |                |   |------------  |  |",
      "| |     .    .     |   |------------  |  |",
      "| |________________|   |------------  |  |",
      "|                      | .......... |    |",
      "|                      | .......... |    |",
      "|                      |____________|    |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Mixed input",
  },
  slug: "multimodal-chatbot",
  title: "Multi-Modal Chatbot",
  summary:
    "Chat over user-provided images and PDFs in a single turn, preserving the official AI SDK multimodal guide with a productized workspace.",
  pattern: "multimodal",
  publishedAt: "2026-05-22T20:08:13+08:00",
  status: "ready",
  source: "AI SDK 6 stable multimodal guide",
  href: "/demos/multimodal-chatbot",
};
