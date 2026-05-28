import { describe, expect, it, vi } from "vitest";

import {
  createUltraChatbotAgentSandboxToolbox,
  getUltraChatbotAgentSandboxSessionId,
} from "./sandbox-tools";

describe("ultra chatbot agent sandbox toolbox", () => {
  it("adapts the official sandbox and skill tools for one route-backed chat", async () => {
    const session = { sessionId: "sandbox-session" };
    const registry = {
      getSession: vi.fn(() => session),
    };
    const createOfficialTools = vi.fn().mockResolvedValue({
      availableSkills: [
        {
          description: "Challenge product language against project docs.",
          name: "grill-with-docs",
        },
      ],
      primedFiles: [],
      tools: {
        bash: { execute: vi.fn() },
        readFile: { execute: vi.fn() },
        skill: { execute: vi.fn() },
        writeFile: { execute: vi.fn() },
      },
    });
    const readAgentsFile = vi.fn().mockResolvedValue("# Agents\n");

    const toolbox = await createUltraChatbotAgentSandboxToolbox(
      {
        chatId: "7dad003a-e507-448b-ac02-10937a0290da",
        env: {
          VERCEL_PROJECT_ID: "project-id",
          VERCEL_TEAM_ID: "team-id",
          VERCEL_TOKEN: "token",
        },
        visitorId: "visitor-123",
      },
      {
        createOfficialTools,
        getSessionRegistry: vi.fn(() => registry as never),
        readAgentsFile,
        workspaceRoot: "/repo",
      }
    );

    expect(readAgentsFile).toHaveBeenCalledWith("/repo/AGENTS.md", "utf-8");
    expect(registry.getSession).toHaveBeenCalledWith(
      "ultra-chatbot-agent-7dad003a-e507-448b-ac02-10937a0290da"
    );
    expect(createOfficialTools).toHaveBeenCalledWith(
      expect.objectContaining({
        agentsContent: "# Agents\n",
        projectRoot: "/vercel/sandbox/project",
        session,
        skillsDirectory: "/repo/.agents/skills",
      })
    );
    expect(Object.keys(toolbox.tools).sort()).toEqual([
      "bash",
      "readFile",
      "skill",
      "writeFile",
    ]);
    expect(toolbox.contextText).toContain(
      "Sandbox project root: /vercel/sandbox/project"
    );
    expect(toolbox.contextText).toContain(
      "- grill-with-docs: Challenge product language against project docs."
    );
  });

  it("uses a stable sandbox session id per chat", () => {
    expect(
      getUltraChatbotAgentSandboxSessionId(
        "7dad003a-e507-448b-ac02-10937a0290da"
      )
    ).toBe("ultra-chatbot-agent-7dad003a-e507-448b-ac02-10937a0290da");
  });
});
