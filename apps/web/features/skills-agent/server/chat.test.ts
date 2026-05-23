import { describe, expect, it } from "vitest";

import {
  formatVisibleSkillCatalog,
  skillsAgentInstructions,
  toVisibleSkillCatalog,
} from "./chat";
import type { SkillMetadata } from "./skill-catalog";

describe("skills-agent chat prompt helpers", () => {
  it("includes skill paths in the visible catalog payload and prompt text", () => {
    const skills: SkillMetadata[] = [
      {
        description: "Challenge an idea until the project context is precise.",
        name: "grill-with-docs",
        path: "/repo/.agents/skills/grill-with-docs",
      },
      {
        description: "Draft a reusable skill package from aligned context.",
        name: "skill-creator",
        path: "/repo/.agents/skills/skill-creator",
      },
    ];

    const visibleCatalog = toVisibleSkillCatalog(skills);

    expect(visibleCatalog).toEqual([
      {
        description: "Challenge an idea until the project context is precise.",
        name: "grill-with-docs",
        path: "/repo/.agents/skills/grill-with-docs",
      },
      {
        description: "Draft a reusable skill package from aligned context.",
        name: "skill-creator",
        path: "/repo/.agents/skills/skill-creator",
      },
    ]);
    expect(formatVisibleSkillCatalog({ skills: visibleCatalog })).toContain(
      "grill-with-docs: Challenge an idea until the project context is precise. (path: /repo/.agents/skills/grill-with-docs)"
    );
    expect(formatVisibleSkillCatalog({ skills: visibleCatalog })).toContain(
      "skill-creator: Draft a reusable skill package from aligned context. (path: /repo/.agents/skills/skill-creator)"
    );
  });

  it("keeps skill selection generic and description-driven in the system instructions", () => {
    expect(skillsAgentInstructions).toContain(
      "Choose a skill based on the visible catalog descriptions when the user's request matches one of them."
    );
    expect(skillsAgentInstructions).not.toContain(
      "For rough ideas, start with grill-with-docs"
    );
    expect(skillsAgentInstructions).not.toContain(
      "When the user wants a reusable capability, load skill-creator"
    );
  });
});
