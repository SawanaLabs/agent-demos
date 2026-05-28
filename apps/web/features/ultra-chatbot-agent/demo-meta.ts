import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const ultraChatbotAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "violet",
    ascii: [
      "+----------------------------------------+",
      "|   .---------.        .------------.    |",
      "|  /  [] [][]  \\----->|  ~~~~~~~~  |    |",
      "|  \\  [] [][]  /<-----|  ========  |    |",
      "|   '---------'        '------------'    |",
      "|        |                    ^          |",
      "|        v                    |          |",
      "|   .------------.      .------------.   |",
      "|   |  [][] + [] |----->|  [] + []   |   |",
      "|   |  [][] + [] |<-----|  [] + []   |   |",
      "|   '------------'      '------------'   |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "App-shape port",
  },
  href: "/demos/ultra-chatbot-agent",
  pattern: "foundation",
  slug: "ultra-chatbot-agent",
  source:
    "Pinned vercel/ai-chatbot snapshot ported into this repo architecture",
  status: "ready",
  summary:
    "An application-shape chatbot port with visitor-owned URLs, model selection, Postgres persistence, and resumable streams as the base for the full vercel/chatbot capability set.",
  title: "Ultra Chatbot Agent",
};
