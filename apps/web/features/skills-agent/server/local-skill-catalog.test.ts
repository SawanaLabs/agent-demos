import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { discoverWorkspaceSkills } from "./local-skill-catalog";

describe("local skills catalog", () => {
  it("returns an empty catalog when the configured skills directory is absent", async () => {
    const workspaceRoot = await mkdtemp(
      path.join(tmpdir(), "skills-agent-catalog-")
    );
    const missingSkillsDirectory = path.join(workspaceRoot, ".agents/skills");

    try {
      await expect(
        discoverWorkspaceSkills([missingSkillsDirectory])
      ).resolves.toEqual([]);
    } finally {
      await rm(workspaceRoot, { force: true, recursive: true });
    }
  });
});
