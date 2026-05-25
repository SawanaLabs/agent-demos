import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const streamingChatShellDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "sky",
    ascii: [
      "+----------------------------------------+",
      "|                                        |",
      "|    .------------------------------.    |",
      "|   /................................\\   |",
      "|  |..__/\\....../\\__....../\\__/\\......|  |",
      "|  |../....\\..../....\\..../....\\......|  |",
      "|  |./......\\__/......\\__/......\\.....|  |",
      "|  |\\........../........\\........../..|  |",
      "|  |..\\__/\\...\\__/\\....\\__/\\..........|  |",
      "|  |..../..\\..../..\\..../..\\..../.....|  |",
      "|  |.../....\\__/.../....\\__/.../......|  |",
      "|  |..\\............................/..|  |",
      "|  |.__/\\....../\\__....../\\....../__..|  |",
      "|   \\________________________________/   |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Streaming shell",
  },
  slug: "streaming-chat-shell",
  title: "Streaming Chat Shell",
  summary:
    "A developer-facing chat runtime shell that demonstrates shared useChat state, feature-local request metadata, and a replayable SSE trace.",
  pattern: "foundation",
  status: "ready",
  source: "AI SDK 6 chat and streaming runtime recipes",
  href: "/demos/streaming-chat-shell",
};
