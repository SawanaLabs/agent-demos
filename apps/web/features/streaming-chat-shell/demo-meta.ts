import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const streamingChatShellDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "sky",
    label: "Streaming shell",
    steps: ["Request", "Trace", "Replay"],
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
