import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDirectory, "../../../../../");
const initSkillScript = path.join(
  repoRoot,
  ".agents/skills/skill-creator/scripts/init_skill.py"
);

describe("skill-creator template", () => {
  it("generates a SKILL.md description frontmatter value as a YAML string", async () => {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "skill-creator-"));
    const skillName = "invoice-review-integration";

    try {
      await execFileAsync(
        "uv",
        ["run", "python", initSkillScript, skillName, "--path", outputRoot],
        { cwd: repoRoot }
      );

      const skillFile = await readFile(
        path.join(outputRoot, skillName, "SKILL.md"),
        "utf-8"
      );

      expect(skillFile).toContain('description: "TODO: Complete');
      expect(skillFile).not.toContain("description: [TODO:");
    } finally {
      await rm(outputRoot, { force: true, recursive: true });
    }
  });
});
