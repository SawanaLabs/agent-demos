import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const loopAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "amber",
    ascii: [
      "+----------------------------------------+",
      "|                                        |",
      "|    .------------.    .------------.    |",
      "|   /  .--------.  \\  /------------\\     |",
      "|  |  /  .--.    \\  ||  .--.--.    ||    |",
      "|  | |  (....)    | || |  |||| |    ||   |",
      "|  | |   ----     |====|  |||| |====||   |",
      "|  | |   ----     |====|  |||| |====||   |",
      "|  | |   [] []    | || |  |||| |    ||   |",
      "|  |  \\__________/  ||  '----'      ||   |",
      "|   \\______________/ |---.    .----/     |",
      "|                     |  /======\\        |",
      "|                     | |  ----  |       |",
      "|                     | |  [] [] |       |",
      "|                     |  \\______/        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Approval gate",
  },
  slug: "loop-agent",
  title: "Loop Agent",
  summary:
    "A support triage agent that shows parallel context lookup, dependent SLA checks, human approval, visible tool state, and bounded loop control.",
  pattern: "loop",
  status: "ready",
  source: "AI SDK 6 stable tool-calling, loop-control, and HITL recipes",
  href: "/demos/loop-agent",
};
