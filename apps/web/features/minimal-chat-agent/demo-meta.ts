import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const minimalChatAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "cyan",
    ascii: [
      "╭─────────╮",
      "│ ◇ → ⌕  │",
      "│ ↑   ↓  │",
      "│ ? ← ✓  │",
      "╰─────────╯",
    ].join("\n"),
    label: "Search + HITL",
  },
  href: "/demos/minimal-chat-agent",
  pattern: "tools",
  slug: "minimal-chat-agent",
  source: "shadcn-ui/chatbot-template",
  status: "ready",
  summary:
    "A small tool-calling chat agent with provider-native web search, public GitHub repository lookup, and a questionnaire that returns human answers into the same agent loop.",
  title: "Minimal Chat Agent",
};
