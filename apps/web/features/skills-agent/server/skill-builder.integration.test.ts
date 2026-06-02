import { describe, expect, it } from "vitest";
import {
  assertVercelSandboxIntegrationTestReady,
  createVercelSandboxIntegrationOptions,
  createVercelSandboxIntegrationSessionId,
} from "@/features/shared/vercel-sandbox/server/integration-test";
import { getSkillsAgentEnv } from "./env";
import { discoverWorkspaceSkills } from "./local-skill-catalog";
import {
  createSkillsAgentSandbox,
  createSkillsAgentSessionRegistry,
  SANDBOX_SKILLS_ROOT,
  type SkillsAgentSandboxHandle,
  type SkillsAgentSession,
} from "./sandbox";

async function expectSandboxCommandToPass(
  session: SkillsAgentSession,
  command: string
) {
  const result = await session.runCommand(command);

  expect(
    result.exitCode,
    [result.stderr.trim(), result.stdout.trim(), result.command]
      .filter(Boolean)
      .join("\n")
  ).toBe(0);

  return result;
}

describe("skills-agent Vercel Sandbox Skill Builder integration", () => {
  it("creates and validates a skill artifact through the skill-creator path", async () => {
    const env = getSkillsAgentEnv();
    assertVercelSandboxIntegrationTestReady(env);

    const sessionId = createVercelSandboxIntegrationSessionId(
      "skills-agent-skill-builder"
    );
    const createdSandboxes: SkillsAgentSandboxHandle[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: async (sandboxSessionId) => {
        const sandbox = await createSkillsAgentSandbox(
          sandboxSessionId,
          env,
          createVercelSandboxIntegrationOptions({
            feature: "skills-agent",
            scenario: "skill-builder",
          })
        );
        createdSandboxes.push(sandbox);
        return sandbox;
      },
    });

    try {
      const session = registry.getSession(sessionId);
      const skills = await discoverWorkspaceSkills();

      expect(skills.map((skill) => skill.name)).toContain("skill-creator");

      const loadedSkill = await session.loadSkill(skills, "skill-creator");

      expect(loadedSkill.skillDirectory).toBe(
        `${SANDBOX_SKILLS_ROOT}/skill-creator`
      );
      await expect(
        session.listSkillFiles(loadedSkill.skillDirectory)
      ).resolves.toEqual(
        expect.arrayContaining([
          "scripts/generate_openai_yaml.py",
          "scripts/init_skill.py",
          "scripts/quick_validate.py",
        ])
      );

      const createdSkillName = "invoice-review-integration";
      const initResult = await expectSandboxCommandToPass(
        session,
        [
          "uv run python .agents/skills/skill-creator/scripts/init_skill.py",
          createdSkillName,
          "--path artifacts",
          "--resources scripts,references",
        ].join(" ")
      );

      expect(initResult.stdout).toContain(
        `Skill '${createdSkillName}' initialized successfully`
      );

      const skillFile = await session.readFile(
        `artifacts/${createdSkillName}/SKILL.md`
      );

      expect(skillFile).toContain(`name: ${createdSkillName}`);
      expect(skillFile).toContain("description:");

      const validationResult = await expectSandboxCommandToPass(
        session,
        `uv run --with pyyaml python .agents/skills/skill-creator/scripts/quick_validate.py artifacts/${createdSkillName}`
      );

      expect(validationResult.stdout).toContain("Skill is valid!");
    } finally {
      await registry.stopSession(sessionId);
      await Promise.allSettled(
        createdSandboxes.map((sandbox) => sandbox.delete?.())
      );
    }
  });
});
