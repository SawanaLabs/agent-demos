import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const traceEvalAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "cyan",
    ascii: [
      "+----------------------------------------+",
      "|                                        |",
      "|                                        |",
      "|   o----o----o--------------.           |",
      "|   |    |    |              |           |",
      "|   :....:....:........      |           |",
      "|                      /.    |           |",
      "|                     /  .---+---.       |",
      "|                        o---+---.       |",
      "|                                |       |",
      "|                           .----+---.   |",
      "|                           | [][]  |    |",
      "|                           '--------'   |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Trace + eval",
  },
  href: "/demos/trace-eval-agent",
  pattern: "tools",
  slug: "trace-eval-agent",
  source: "AI SDK 6 Gateway search, telemetry, and testing recipes",
  status: "ready",
  summary:
    "A live research agent that searches the web through AI Gateway, then scores the current conversation with source, answer-shape, and expected-path checks.",
  title: "Trace and Eval Agent",
};
