import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const openAiAgentsSdkDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "indigo",
    ascii: [
      "+----------------------------------------+",
      "|                                        |",
      "|                                        |",
      "|    OOO   PPPP  EEEEE N   N   AAA   III |",
      "|   O   O  P   P E     NN  N  A   A   I  |",
      "|   O   O  PPPP  EEE   N N N  AAAAA   I  |",
      "|   O   O  P     E     N  NN  A   A   I  |",
      "|    OOO   P     EEEEE N   N  A   A  III |",
      "|                                        |",
      "|                                        |",
      "|                                        |",
      "|                                        |",
      "|                                        |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Official bridge",
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
