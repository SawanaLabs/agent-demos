import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ToolSet } from "ai";
import type { SkillsAgentEnv } from "@/features/skills-agent/server/env";
import { SKILLS_AGENT_WORKSPACE_ROOT } from "@/features/skills-agent/server/local-skill-catalog";
import {
  createSkillsAgentOfficialTools,
  type SkillsAgentOfficialTools,
} from "@/features/skills-agent/server/official-tools";
import {
  getSharedSkillsAgentSessionRegistry,
  SANDBOX_ARTIFACTS_ROOT,
  SANDBOX_PROJECT_ROOT,
} from "@/features/skills-agent/server/sandbox";

export interface UltraChatbotAgentSandboxToolbox {
  availableSkills: SkillsAgentOfficialTools["availableSkills"];
  contextText: string;
  tools: ToolSet;
}

interface CreateUltraChatbotAgentSandboxToolboxDependencies {
  createOfficialTools?: typeof createSkillsAgentOfficialTools;
  getSessionRegistry?: typeof getSharedSkillsAgentSessionRegistry;
  readAgentsFile?: typeof readFile;
  workspaceRoot?: string;
}

function formatAvailableSkills(
  skills: SkillsAgentOfficialTools["availableSkills"]
) {
  if (skills.length === 0) {
    return "No workspace skills are available.";
  }

  return skills
    .map((skill) => `- ${skill.name}: ${skill.description}`)
    .join("\n");
}

export function getUltraChatbotAgentSandboxSessionId(chatId: string) {
  return `ultra-chatbot-agent-${chatId}`;
}

export async function createUltraChatbotAgentSandboxToolbox(
  {
    chatId,
    env,
  }: {
    chatId: string;
    env?: SkillsAgentEnv;
    visitorId: string;
  },
  dependencies: CreateUltraChatbotAgentSandboxToolboxDependencies = {}
): Promise<UltraChatbotAgentSandboxToolbox> {
  const workspaceRoot =
    dependencies.workspaceRoot ?? SKILLS_AGENT_WORKSPACE_ROOT;
  const readAgentsFile = dependencies.readAgentsFile ?? readFile;
  const createOfficialTools =
    dependencies.createOfficialTools ?? createSkillsAgentOfficialTools;
  const getSessionRegistry =
    dependencies.getSessionRegistry ?? getSharedSkillsAgentSessionRegistry;
  const agentsContent = await readAgentsFile(
    path.join(workspaceRoot, "AGENTS.md"),
    "utf-8"
  );
  const toolset = await createOfficialTools({
    agentsContent,
    projectRoot: SANDBOX_PROJECT_ROOT,
    session: getSessionRegistry(env).getSession(
      getUltraChatbotAgentSandboxSessionId(chatId)
    ),
    skillsDirectory: path.join(workspaceRoot, ".agents/skills"),
  });

  return {
    availableSkills: toolset.availableSkills,
    contextText: [
      `Sandbox project root: ${SANDBOX_PROJECT_ROOT}`,
      `Sandbox artifacts root: ${SANDBOX_ARTIFACTS_ROOT}`,
      `Available skills:\n${formatAvailableSkills(toolset.availableSkills)}`,
    ].join("\n"),
    tools: toolset.tools as ToolSet,
  };
}
