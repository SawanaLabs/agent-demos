import { posix as posixPath } from "node:path";

import type { SkillsAgentSession } from "./sandbox";
import type { SkillMetadata } from "./skill-catalog";

const DEFAULT_SKILLS_DESTINATION = ".agents/skills";
const LEADING_DOT_SLASH_PATTERN = /^\.\//;
const SKILL_NAME_ALIAS_SEPARATOR_PATTERN = /[\s_]+/g;
const REPEATED_DASH_PATTERN = /-+/g;

const SKILLS_AGENT_TOOL_PROMPT = [
  "Use bash to explore the sandbox workspace and inspect files after loading a skill.",
  "Use readFile and writeFile for direct file access.",
  "Load a skill before using sandbox tools that depend on repository context.",
].join(" ");

export interface SkillsAgentOfficialTools {
  availableSkills: Pick<SkillMetadata, "description" | "name">[];
  primedFiles: { content: string; path: string }[];
  tools: Record<string, unknown>;
}

interface OfficialSkill {
  description: string;
  localPath: string;
  name: string;
}

interface SkillToolkit {
  files: Record<string, string>;
  instructions: string;
  skill: unknown;
  skills: OfficialSkill[];
}

interface SkillToolSuccessResult {
  files: string[];
  instructions: string;
  skill: {
    description: string;
    name: string;
    path: string;
  };
  success: true;
}

function stripLeadingDotSlash(targetPath: string) {
  return targetPath.replace(LEADING_DOT_SLASH_PATTERN, "");
}

function normalizeSkillLookupKey(skillName: string) {
  return skillName
    .trim()
    .toLowerCase()
    .replace(SKILL_NAME_ALIAS_SEPARATOR_PATTERN, "-")
    .replace(REPEATED_DASH_PATTERN, "-");
}

function resolveSkillNameAlias(
  availableSkills: SkillMetadata[],
  requestedSkillName: string
) {
  const trimmedSkillName = requestedSkillName.trim();
  const exactMatch = availableSkills.find(
    (skill) => skill.name === trimmedSkillName
  );

  if (exactMatch) {
    return exactMatch.name;
  }

  const normalizedRequestedSkillName =
    normalizeSkillLookupKey(trimmedSkillName);
  const normalizedMatch = availableSkills.find(
    (skill) =>
      normalizeSkillLookupKey(skill.name) === normalizedRequestedSkillName
  );

  return normalizedMatch?.name ?? trimmedSkillName;
}

function toSessionSkills(skills: OfficialSkill[]): SkillMetadata[] {
  return skills.map((skill) => ({
    description: skill.description,
    name: skill.name,
    path: skill.localPath,
  }));
}

function isSameSkillPath(leftPath: string, rightPath: string) {
  return leftPath === rightPath;
}

function findSkillByName(skills: SkillMetadata[], name: string) {
  return skills.find(
    (skill) => skill.name.toLowerCase() === name.toLowerCase()
  );
}

function isInitialSkill(
  skill: SkillMetadata | undefined,
  initialSkills: SkillMetadata[]
) {
  if (!skill) {
    return false;
  }

  return initialSkills.some(
    (initialSkill) =>
      initialSkill.name.toLowerCase() === skill.name.toLowerCase() &&
      isSameSkillPath(initialSkill.path, skill.path)
  );
}

function createSkillToolError(error: unknown) {
  return {
    error: error instanceof Error ? error.message : String(error),
    success: false,
  };
}

async function createLoadedSkillToolResult({
  availableSkills,
  loadedSkill,
  session,
}: {
  availableSkills: SkillMetadata[];
  loadedSkill: Awaited<ReturnType<SkillsAgentSession["loadSkill"]>>;
  session: SkillsAgentSession;
}): Promise<SkillToolSuccessResult> {
  const metadata = findSkillByName(availableSkills, loadedSkill.name);

  if (!metadata) {
    throw new Error(`Loaded skill "${loadedSkill.name}" is missing metadata.`);
  }

  return {
    files: await session.listSkillFiles(loadedSkill.skillDirectory),
    instructions: loadedSkill.content,
    skill: {
      description: metadata.description,
      name: loadedSkill.name,
      path: loadedSkill.skillDirectory,
    },
    success: true,
  };
}

function buildPrimedFiles({
  agentsContent,
  projectRoot,
  toolkit,
}: {
  agentsContent: string;
  projectRoot: string;
  toolkit: SkillToolkit;
}) {
  return [
    {
      content: agentsContent,
      path: posixPath.join(projectRoot, "AGENTS.md"),
    },
    ...Object.entries(toolkit.files).map(([relativePath, content]) => ({
      content,
      path: posixPath.join(projectRoot, stripLeadingDotSlash(relativePath)),
    })),
  ];
}

function createSessionBackedSandbox(session: SkillsAgentSession) {
  return {
    executeCommand: async (command: string) => {
      const result = await session.runCommand(command);

      return {
        exitCode: result.exitCode,
        stderr: result.stderr,
        stdout: result.stdout,
      };
    },
    readFile: (targetPath: string) => session.readFile(targetPath),
    writeFiles: async (files: { content: string | Buffer; path: string }[]) => {
      for (const file of files) {
        await session.writeFile(
          file.path,
          typeof file.content === "string"
            ? file.content
            : file.content.toString("utf-8")
        );
      }
    },
  };
}

export async function createSkillsAgentOfficialTools({
  agentsContent,
  projectRoot,
  session,
  skillsDirectory,
}: {
  agentsContent: string;
  projectRoot: string;
  session: SkillsAgentSession;
  skillsDirectory: string;
}): Promise<SkillsAgentOfficialTools> {
  const { createBashTool, experimental_createSkillTool } = await import(
    "bash-tool"
  );
  const skillToolkit = await experimental_createSkillTool({
    destination: DEFAULT_SKILLS_DESTINATION,
    skillsDirectory,
  });
  const sessionSkills = toSessionSkills(skillToolkit.skills);
  const bashToolkit = await createBashTool({
    destination: projectRoot,
    extraInstructions: skillToolkit.instructions,
    promptOptions: {
      toolPrompt: SKILLS_AGENT_TOOL_PROMPT,
    },
    sandbox: createSessionBackedSandbox(session),
  });
  const officialSkillTool = skillToolkit.skill as {
    description?: string;
    execute: (input: { skillName: string }) => Promise<unknown>;
    inputSchema?: unknown;
  };

  const skillTool = {
    ...officialSkillTool,
    description: [
      officialSkillTool.description,
      `This tool also scans ${DEFAULT_SKILLS_DESTINATION} inside the active sandbox before each load, so skills installed during the current chat can be loaded by name.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    execute: async ({ skillName }: { skillName: string }) => {
      try {
        const availableSkills = await session.discoverSkills(sessionSkills);
        const canonicalSkillName = resolveSkillNameAlias(
          availableSkills,
          skillName
        );
        const selectedSkill = findSkillByName(
          availableSkills,
          canonicalSkillName
        );
        const loadedSkill = await session.loadSkill(
          availableSkills,
          canonicalSkillName
        );

        if (isInitialSkill(selectedSkill, sessionSkills)) {
          return officialSkillTool.execute({ skillName: canonicalSkillName });
        }

        return createLoadedSkillToolResult({
          availableSkills,
          loadedSkill,
          session,
        });
      } catch (error) {
        return createSkillToolError(error);
      }
    },
  };

  return {
    availableSkills: sessionSkills.map(({ description, name }) => ({
      description,
      name,
    })),
    primedFiles: buildPrimedFiles({
      agentsContent,
      projectRoot,
      toolkit: skillToolkit,
    }),
    tools: {
      ...bashToolkit.tools,
      skill: skillTool,
    },
  };
}
