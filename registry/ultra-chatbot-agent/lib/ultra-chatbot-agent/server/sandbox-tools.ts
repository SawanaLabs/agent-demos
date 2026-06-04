import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ToolSet } from "ai";
import type { SkillsAgentEnv } from "@/lib/ultra-chatbot-agent/skills-agent/server/env";
import {
  discoverWorkspaceSkills,
  SKILLS_AGENT_WORKSPACE_ROOT,
} from "@/lib/ultra-chatbot-agent/skills-agent/server/local-skill-catalog";
import {
  createSkillsAgentOfficialTools,
  type SkillsAgentOfficialTools,
} from "@/lib/ultra-chatbot-agent/skills-agent/server/official-tools";
import {
  getSharedSkillsAgentSessionRegistry,
  SANDBOX_ARTIFACTS_ROOT,
  SANDBOX_PROJECT_ROOT,
} from "@/lib/ultra-chatbot-agent/skills-agent/server/sandbox";

export interface UltraChatbotAgentSandboxToolbox {
  availableSkills: SkillsAgentOfficialTools["availableSkills"];
  contextText: string;
  tools: ToolSet;
}

interface CreateUltraChatbotAgentSandboxToolboxDependencies {
  createOfficialTools?: typeof createSkillsAgentOfficialTools;
  discoverSkills?: typeof discoverWorkspaceSkills;
  getSessionRegistry?: typeof getSharedSkillsAgentSessionRegistry;
  readAgentsFile?: typeof readFile;
  workspaceRoot?: string;
}

const defaultAgentsContent = [
  "# Ultra Chatbot Agent Consumer Workspace",
  "",
  "This project can install repo-local skills under `.agents/skills`.",
  "Use loaded skill instructions as the source of truth, keep generated drafts under `artifacts/` unless a skill names a canonical path, and inspect optional repository files before reading them.",
].join("\n");

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function readAgentsContent(
  agentsPath: string,
  readAgentsFile: typeof readFile
) {
  try {
    return await readAgentsFile(agentsPath, "utf-8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return defaultAgentsContent;
    }

    throw error;
  }
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
  const discoverSkills = dependencies.discoverSkills ?? discoverWorkspaceSkills;
  const agentsContent = await readAgentsContent(
    path.join(workspaceRoot, "AGENTS.md"),
    readAgentsFile
  );
  const session = (await getSessionRegistry(env)).getSession(
    getUltraChatbotAgentSandboxSessionId(chatId)
  );
  const skills = await discoverSkills([
    path.join(workspaceRoot, ".agents/skills"),
  ]);
  await session.writeFile("AGENTS.md", agentsContent);
  const toolset = await createOfficialTools({
    agentsContent,
    projectRoot: SANDBOX_PROJECT_ROOT,
    session,
    skills,
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
