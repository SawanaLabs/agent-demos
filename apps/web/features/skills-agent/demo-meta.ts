import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const skillsAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "emerald",
    ascii: [
      "+----------------------------------------+",
      "|                                        |",
      "|            .--------------.            |",
      "|        .--/-------------. |            |",
      "|       /__/_____________/| |            |",
      "|      /_______________/ || |            |",
      "|      |  .--------.   | || |            |",
      "|      |  |  ----  |   | || |            |",
      "|      |  |  ----  |   | || |            |",
      "|      |  |  [] [] |   | || |            |",
      "|      |  '--------'   | || |            |",
      "|      |  .--------.   | ||/             |",
      "|      |  |  ----  |   | |/              |",
      "|      |  '--------'   | /               |",
      "|      '---------------'/                |",
      "|                                        |",
      "+----------------------------------------+",
    ].join("\n"),
    label: "Skill folder",
  },
  slug: "skills-agent",
  title: "Skills Builder Agent",
  summary:
    "A sandbox-backed ToolLoopAgent that loads repo-local skills on demand, pressures a rough idea into durable context, and drafts reusable SKILL.md artifacts.",
  pattern: "skills",
  publishedAt: "2026-05-22T00:35:40+08:00",
  status: "ready",
  href: "/demos/skills-agent",
  source: "AI SDK Add Skills to Your Agent guide",
};
