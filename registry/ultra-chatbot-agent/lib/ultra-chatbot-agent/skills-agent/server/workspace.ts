import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSkillsAgentEnv } from "./env";
import { SKILLS_AGENT_WORKSPACE_ROOT } from "./local-skill-catalog";
import {
  createSkillsAgentOfficialTools,
  type SkillsAgentOfficialTools,
} from "./official-tools";
import {
  getSharedSkillsAgentSessionRegistry,
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
const defaultAgentsContent = [
  "# Skills Agent Consumer Workspace",
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

async function readAgentsContent(readAgentsFile: typeof readFile) {
  try {
    return await readAgentsFile(SKILLS_AGENT_AGENTS_PATH, "utf-8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return defaultAgentsContent;
    }

    throw error;
  }
}

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
    env = getSkillsAgentEnv(),
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
  const session = (
    await getSharedSkillsAgentSessionRegistry(env)
  ).getSession(sessionId);
  const visibleSkillCatalog = toVisibleSkillCatalog(skills);
  const agentsContent = await readAgentsContent(readAgentsFile);
  await session.writeFile("AGENTS.md", agentsContent);
  const toolset = await createOfficialTools({
    agentsContent,
    projectRoot: session.projectRoot,
    session,
    skills,
  });

  return {
    artifactsRoot: session.artifactsRoot,
    projectRoot: session.projectRoot,
    session,
    toolset,
    visibleSkillCatalog,
    visibleSkillCatalogText: formatVisibleSkillCatalog(visibleSkillCatalog),
  };
}
