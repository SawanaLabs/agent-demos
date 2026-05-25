import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const openAiAgentsSdkDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "indigo",
    label: "Official bridge",
    steps: ["Transcript", "Run", "Bridge"],
  },
  slug: "openai-agents-sdk-demo",
  title: "OpenAI Agents SDK Demo",
  summary:
    "An official OpenAI Agents SDK backend bridged into the existing AI SDK UI workspace without rewriting the agent runtime into repo-local orchestration.",
  pattern: "foundation",
  status: "ready",
  source: "OpenAI Agents SDK guides and official AI SDK UI bridge example",
  href: "/demos/openai-agents-sdk-demo",
};
