import { readFile } from "node:fs/promises";
import path from "node:path";
import { env as appEnv } from "@/env";

import { SKILLS_AGENT_WORKSPACE_ROOT } from "./local-skill-catalog";
import {
  createSkillsAgentOfficialTools,
  type SkillsAgentOfficialTools,
} from "./official-tools";
import {
  getSharedSkillsAgentSessionRegistry,
  SANDBOX_ARTIFACTS_ROOT,
  SANDBOX_PROJECT_ROOT,
  type SkillsAgentSession,
} from "./sandbox";
import type { SkillMetadata } from "./skill-catalog";

type DemoEnv = Record<string, string | undefined>;

export interface VisibleSkillMetadata {
  description: string;
  name: string;
  path: string;
}

export interface SkillsAgentWorkspace {
  readonly artifactsRoot: string;
  readonly projectRoot: string;
  readonly session: SkillsAgentSession;
  readonly toolset: SkillsAgentOfficialTools;
  readonly visibleSkillCatalog: VisibleSkillMetadata[];
  readonly visibleSkillCatalogText: string;
}

export const SKILLS_AGENT_AGENTS_PATH = path.join(
  SKILLS_AGENT_WORKSPACE_ROOT,
  "AGENTS.md"
);
export const SKILLS_AGENT_SKILLS_DIRECTORY = path.join(
  SKILLS_AGENT_WORKSPACE_ROOT,
  ".agents/skills"
);

export function toVisibleSkillCatalog(
  skills: SkillMetadata[]
): VisibleSkillMetadata[] {
  return skills.map(({ description, name, path }) => ({
    description,
    name,
    path,
  }));
}

export function formatVisibleSkillCatalog(skills: VisibleSkillMetadata[]) {
  return skills
    .map(
      (skill) => `- ${skill.name}: ${skill.description} (path: ${skill.path})`
    )
    .join("\n");
}

export async function createSkillsAgentWorkspace(
  {
    env = appEnv,
    sessionId,
    skills,
  }: {
    env?: DemoEnv;
    sessionId: string;
    skills: SkillMetadata[];
  },
  dependencies: {
    createOfficialTools?: typeof createSkillsAgentOfficialTools;
    readAgentsFile?: typeof readFile;
  } = {}
): Promise<SkillsAgentWorkspace> {
  const readAgentsFile = dependencies.readAgentsFile ?? readFile;
  const createOfficialTools =
    dependencies.createOfficialTools ?? createSkillsAgentOfficialTools;
  const session =
    getSharedSkillsAgentSessionRegistry(env).getSession(sessionId);
  const visibleSkillCatalog = toVisibleSkillCatalog(skills);
  const agentsContent = await readAgentsFile(SKILLS_AGENT_AGENTS_PATH, "utf-8");
  const toolset = await createOfficialTools({
    agentsContent,
    projectRoot: SANDBOX_PROJECT_ROOT,
    session,
    skillsDirectory: SKILLS_AGENT_SKILLS_DIRECTORY,
  });

  return {
    artifactsRoot: SANDBOX_ARTIFACTS_ROOT,
    projectRoot: SANDBOX_PROJECT_ROOT,
    session,
    toolset,
    visibleSkillCatalog,
    visibleSkillCatalogText: formatVisibleSkillCatalog(visibleSkillCatalog),
  };
}
