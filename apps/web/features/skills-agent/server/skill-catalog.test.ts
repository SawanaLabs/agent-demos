import { describe, expect, it } from "vitest";

import { discoverSkills, loadSkill, type SkillsSandbox } from "./skill-catalog";

class FakeDirent {
  readonly name: string;
  readonly directory: boolean;

  constructor(name: string, directory: boolean) {
    this.name = name;
    this.directory = directory;
  }

  isDirectory() {
    return this.directory;
  }
}

class FakeSandbox implements SkillsSandbox {
  readonly directories: Record<string, FakeDirent[]>;
  readonly files: Record<string, string>;

  constructor(
    directories: Record<string, FakeDirent[]>,
    files: Record<string, string>
  ) {
    this.directories = directories;
    this.files = files;
  }

  exec() {
    return Promise.resolve({
      stderr: "",
      stdout: "",
    });
  }

  readdir(path: string, opts?: { withFileTypes?: boolean }) {
    const entries = this.directories[path] ?? [];

    if (opts?.withFileTypes) {
      return Promise.resolve(entries);
    }

    return Promise.resolve(entries.map((entry) => entry.name));
  }

  readFile(path: string, encoding: BufferEncoding | "utf-8") {
    if (encoding !== "utf-8") {
      throw new Error(`Unexpected encoding ${encoding}`);
    }

    const file = this.files[path];

    if (!file) {
      throw new Error(`Missing fixture file: ${path}`);
    }

    return Promise.resolve(file);
  }
}

describe("skill catalog", () => {
  it("discovers skill metadata and loads full skill content on demand", async () => {
    const sandbox = new FakeSandbox(
      {
        "/workspace/.agents/skills": [
          new FakeDirent("grill-with-docs", true),
          new FakeDirent("skill-creator", true),
          new FakeDirent("README.md", false),
        ],
      },
      {
        "/workspace/.agents/skills/grill-with-docs/SKILL.md": `---
name: grill-with-docs
description: Challenge an idea until the project context is precise.
---

# Grill With Docs

Ask sharp follow-up questions and draft a CONTEXT file.
`,
        "/workspace/.agents/skills/skill-creator/SKILL.md": `---
name: skill-creator
description: Create or update a reusable skill package from aligned context.
---

# Skill Creator

Turn durable workflow knowledge into a SKILL.md draft.
`,
      }
    );

    const skills = await discoverSkills(sandbox, ["/workspace/.agents/skills"]);

    expect(skills).toEqual([
      {
        description: "Challenge an idea until the project context is precise.",
        name: "grill-with-docs",
        path: "/workspace/.agents/skills/grill-with-docs",
      },
      {
        description:
          "Create or update a reusable skill package from aligned context.",
        name: "skill-creator",
        path: "/workspace/.agents/skills/skill-creator",
      },
    ]);

    await expect(loadSkill(sandbox, skills, "skill-creator")).resolves.toEqual({
      content: `# Skill Creator

Turn durable workflow knowledge into a SKILL.md draft.`,
      name: "skill-creator",
      skillDirectory: "/workspace/.agents/skills/skill-creator",
    });
  });
});
