import { describe, expect, it, vi } from "vitest";

import type { SkillMetadata } from "./skill-catalog";
import {
  createSkillsAgentWorkspace,
  formatVisibleSkillCatalog,
  SKILLS_AGENT_AGENTS_PATH,
  SKILLS_AGENT_SKILLS_DIRECTORY,
  toVisibleSkillCatalog,
} from "./workspace";

const getSessionMock = vi.fn();

vi.mock("./sandbox", () => ({
  SANDBOX_ARTIFACTS_ROOT: "/vercel/sandbox/project/artifacts",
  SANDBOX_PROJECT_ROOT: "/vercel/sandbox/project",
  getSharedSkillsAgentSessionRegistry: vi.fn(() => ({
    getSession: getSessionMock,
  })),
}));

describe("skills-agent workspace", () => {
  it("formats the visible catalog from programmatic skill metadata", () => {
    const skills: SkillMetadata[] = [
      {
        description: "Challenge an idea until the project context is precise.",
        name: "grill-with-docs",
        path: "/repo/.agents/skills/grill-with-docs",
      },
    ];

    expect(toVisibleSkillCatalog(skills)).toEqual([
      {
        description: "Challenge an idea until the project context is precise.",
        name: "grill-with-docs",
        path: "/repo/.agents/skills/grill-with-docs",
      },
    ]);
    expect(formatVisibleSkillCatalog(toVisibleSkillCatalog(skills))).toContain(
      "grill-with-docs: Challenge an idea until the project context is precise. (path: /repo/.agents/skills/grill-with-docs)"
    );
  });

  it("builds a deep workspace object that hides AGENTS and skills directory wiring", async () => {
    const session = {
      readFile: vi.fn(),
      runCommand: vi.fn(),
      writeFile: vi.fn(),
    };
    const createOfficialTools = vi.fn().mockResolvedValue({
      availableSkills: [
        { description: "Challenge ideas.", name: "grill-with-docs" },
      ],
      primedFiles: [],
      tools: { bash: { execute: vi.fn() } },
    });
    const readAgentsFile = vi.fn().mockResolvedValue("# Agents\n");

    getSessionMock.mockReset();
    getSessionMock.mockReturnValue(session);

    const workspace = await createSkillsAgentWorkspace(
      {
        sessionId: "chat-1",
        skills: [
          {
            description: "Challenge ideas.",
            name: "grill-with-docs",
            path: "/repo/.agents/skills/grill-with-docs",
          },
        ],
      },
      {
        createOfficialTools,
        readAgentsFile,
      }
    );

    expect(readAgentsFile).toHaveBeenCalledWith(
      SKILLS_AGENT_AGENTS_PATH,
      "utf-8"
    );
    expect(createOfficialTools).toHaveBeenCalledWith({
      agentsContent: "# Agents\n",
      projectRoot: "/vercel/sandbox/project",
      session,
      skillsDirectory: SKILLS_AGENT_SKILLS_DIRECTORY,
    });
    expect(workspace.projectRoot).toBe("/vercel/sandbox/project");
    expect(workspace.artifactsRoot).toBe("/vercel/sandbox/project/artifacts");
    expect(workspace.session).toBe(session);
    expect(workspace.toolset.tools).toEqual({
      bash: { execute: expect.any(Function) },
    });
    expect(workspace.visibleSkillCatalogText).toContain("grill-with-docs");
  });
});
