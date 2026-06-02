import { beforeEach, describe, expect, it, vi } from "vitest";

const createBashToolMock = vi.fn();
const createSkillToolMock = vi.fn();

vi.mock("bash-tool", () => ({
  createBashTool: createBashToolMock,
  experimental_createSkillTool: createSkillToolMock,
}));

describe("createSkillsAgentOfficialTools", () => {
  beforeEach(() => {
    createBashToolMock.mockReset();
    createSkillToolMock.mockReset();
  });

  it("builds the skills-agent tool suite from the official bash-tool package", async () => {
    createSkillToolMock.mockResolvedValue({
      files: {
        "./.agents/skills/grill-with-docs/SKILL.md": "---",
      },
      instructions: "Skill directories are preloaded.",
      skill: { execute: vi.fn() },
      skills: [
        {
          description: "Challenge ideas.",
          files: ["SKILL.md"],
          localPath: "/repo/.agents/skills/grill-with-docs",
          name: "grill-with-docs",
          sandboxPath: "./.agents/skills/grill-with-docs",
        },
      ],
    });
    createBashToolMock.mockResolvedValue({
      sandbox: {
        executeCommand: vi.fn(),
        readFile: vi.fn(),
        writeFiles: vi.fn(),
      },
      tools: {
        bash: { execute: vi.fn() },
        readFile: { execute: vi.fn() },
        writeFile: { execute: vi.fn() },
      },
    });

    const { createSkillsAgentOfficialTools } = await import("./official-tools");

    const toolkit = await createSkillsAgentOfficialTools({
      agentsContent: "# Agents\n",
      projectRoot: "/vercel/sandbox/project",
      session: {
        loadSkill: vi.fn(),
        readFile: vi.fn(),
        runCommand: vi.fn(),
        writeFile: vi.fn(),
      } as never,
      skillsDirectory: "/repo/.agents/skills",
    });

    expect(createSkillToolMock).toHaveBeenCalledWith({
      destination: ".agents/skills",
      skillsDirectory: "/repo/.agents/skills",
    });
    expect(createBashToolMock).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "/vercel/sandbox/project",
        extraInstructions: "Skill directories are preloaded.",
        promptOptions: {
          toolPrompt: expect.stringContaining("Use bash to explore"),
        },
        sandbox: expect.objectContaining({
          executeCommand: expect.any(Function),
          readFile: expect.any(Function),
          writeFiles: expect.any(Function),
        }),
      })
    );
    expect(toolkit.availableSkills).toEqual([
      {
        description: "Challenge ideas.",
        name: "grill-with-docs",
      },
    ]);
    expect(Object.keys(toolkit.tools).sort()).toEqual([
      "bash",
      "readFile",
      "skill",
      "writeFile",
    ]);
    expect(toolkit.primedFiles).toEqual(
      expect.arrayContaining([
        {
          content: "# Agents\n",
          path: "/vercel/sandbox/project/AGENTS.md",
        },
        {
          content: "---",
          path: "/vercel/sandbox/project/.agents/skills/grill-with-docs/SKILL.md",
        },
      ])
    );
  });

  it("normalizes skill aliases before loading and executing the official skill tool", async () => {
    const officialExecute = vi.fn().mockResolvedValue({
      skill: {
        name: "skill-creator",
      },
      success: true,
    });
    const session = {
      discoverSkills: vi.fn().mockResolvedValue([
        {
          description: "Create reusable skills.",
          name: "skill-creator",
          path: "/repo/.agents/skills/skill-creator",
        },
      ]),
      listSkillFiles: vi.fn(),
      loadSkill: vi.fn(),
      readFile: vi.fn(),
      runCommand: vi.fn(),
      writeFile: vi.fn(),
    };

    createSkillToolMock.mockResolvedValue({
      files: {},
      instructions: "Skill directories are preloaded.",
      skill: { execute: officialExecute },
      skills: [
        {
          description: "Create reusable skills.",
          files: ["SKILL.md"],
          localPath: "/repo/.agents/skills/skill-creator",
          name: "skill-creator",
          sandboxPath: "./.agents/skills/skill-creator",
        },
      ],
    });
    createBashToolMock.mockResolvedValue({
      sandbox: {
        executeCommand: vi.fn(),
        readFile: vi.fn(),
        writeFiles: vi.fn(),
      },
      tools: {
        bash: { execute: vi.fn() },
        readFile: { execute: vi.fn() },
        writeFile: { execute: vi.fn() },
      },
    });

    const { createSkillsAgentOfficialTools } = await import("./official-tools");

    const toolkit = await createSkillsAgentOfficialTools({
      agentsContent: "# Agents\n",
      projectRoot: "/vercel/sandbox/project",
      session: session as never,
      skillsDirectory: "/repo/.agents/skills",
    });

    const skillTool = toolkit.tools.skill as {
      execute: (input: { skillName: string }) => Promise<unknown>;
    };

    await skillTool.execute({ skillName: "Skill Creator" });

    expect(session.loadSkill).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "skill-creator",
        }),
      ]),
      "skill-creator"
    );
    expect(officialExecute).toHaveBeenCalledWith({
      skillName: "skill-creator",
    });
  });

  it("loads a skill created inside the sandbox after the official skill snapshot", async () => {
    const officialExecute = vi.fn().mockResolvedValue({
      error: 'Skill "word-skill" not found. Available skills: skill-creator',
      success: false,
    });
    const session = {
      discoverSkills: vi.fn().mockResolvedValue([
        {
          description: "Create reusable skills.",
          name: "skill-creator",
          path: "/repo/.agents/skills/skill-creator",
        },
        {
          description: "Work with Word documents.",
          name: "word-skill",
          path: "/vercel/sandbox/project/.agents/skills/word-skill",
        },
      ]),
      listSkillFiles: vi.fn().mockResolvedValue(["references/word.md"]),
      loadSkill: vi.fn().mockResolvedValue({
        content: "# Word Skill\n\nUse this workflow for Word documents.",
        name: "word-skill",
        skillDirectory: "/vercel/sandbox/project/.agents/skills/word-skill",
      }),
      readFile: vi.fn(),
      runCommand: vi.fn(),
      writeFile: vi.fn(),
    };

    createSkillToolMock.mockResolvedValue({
      files: {},
      instructions: "Skill directories are preloaded.",
      skill: { execute: officialExecute },
      skills: [
        {
          description: "Create reusable skills.",
          files: ["SKILL.md"],
          localPath: "/repo/.agents/skills/skill-creator",
          name: "skill-creator",
          sandboxPath: "./.agents/skills/skill-creator",
        },
      ],
    });
    createBashToolMock.mockResolvedValue({
      sandbox: {
        executeCommand: vi.fn(),
        readFile: vi.fn(),
        writeFiles: vi.fn(),
      },
      tools: {
        bash: { execute: vi.fn() },
        readFile: { execute: vi.fn() },
        writeFile: { execute: vi.fn() },
      },
    });

    const { createSkillsAgentOfficialTools } = await import("./official-tools");

    const toolkit = await createSkillsAgentOfficialTools({
      agentsContent: "# Agents\n",
      projectRoot: "/vercel/sandbox/project",
      session: session as never,
      skillsDirectory: "/repo/.agents/skills",
    });

    const skillTool = toolkit.tools.skill as {
      execute: (input: { skillName: string }) => Promise<unknown>;
    };

    await expect(
      skillTool.execute({ skillName: "Word Skill" })
    ).resolves.toEqual({
      files: ["references/word.md"],
      instructions: "# Word Skill\n\nUse this workflow for Word documents.",
      skill: {
        description: "Work with Word documents.",
        name: "word-skill",
        path: "/vercel/sandbox/project/.agents/skills/word-skill",
      },
      success: true,
    });
    expect(session.discoverSkills).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "skill-creator",
        }),
      ])
    );
    expect(session.loadSkill).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "word-skill",
        }),
      ]),
      "word-skill"
    );
    expect(officialExecute).not.toHaveBeenCalled();
  });
});
