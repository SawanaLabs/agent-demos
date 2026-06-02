import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import nextConfig from "./next.config.mjs";

const webDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webDirectory, "../..");

const workspaceSkillTraceGlobs = [
  "../../.agents/skills/grill-with-docs/**/*",
  "../../.agents/skills/skill-creator/SKILL.md",
  "../../.agents/skills/skill-creator/agents/**/*",
  "../../.agents/skills/skill-creator/assets/**/*",
  "../../.agents/skills/skill-creator/license.txt",
  "../../.agents/skills/skill-creator/references/**/*",
  "../../.agents/skills/skill-creator/scripts/*.py",
];

const workspaceSkillRouteGlobs = [
  "/api/demos/skills-agent",
  "/api/demos/ultra-chatbot-agent",
  "/demos/skills-agent",
];

describe("web Next production asset contract", () => {
  it("traces repo-local primary skills for sandbox-backed production routes", () => {
    expect(nextConfig.outputFileTracingRoot).toBe(repoRoot);

    for (const routeGlob of workspaceSkillRouteGlobs) {
      expect(nextConfig.outputFileTracingIncludes?.[routeGlob]).toEqual(
        expect.arrayContaining(workspaceSkillTraceGlobs)
      );
    }

    expect(
      Object.values(nextConfig.outputFileTracingIncludes ?? {}).flat()
    ).not.toContain("../../.agents/skills/**/*");
  });
});
