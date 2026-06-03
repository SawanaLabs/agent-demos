import { type ToolSet, tool } from "ai";
import { z } from "zod";

import type { SkillsAgentSession } from "./sandbox";
import type { SkillMetadata } from "./skill-catalog";

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
  tools: ToolSet;
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

function findSkillByName(skills: SkillMetadata[], name: string) {
  return skills.find(
    (skill) => skill.name.toLowerCase() === name.toLowerCase()
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
}: {
  agentsContent: string;
  projectRoot: string;
}) {
  return [
    {
      content: agentsContent,
      path: `${projectRoot}/AGENTS.md`,
    },
  ];
}

export async function createSkillsAgentOfficialTools({
  agentsContent,
  projectRoot,
  session,
  skills,
}: {
  agentsContent: string;
  projectRoot: string;
  session: SkillsAgentSession;
  skills: SkillMetadata[];
}): Promise<SkillsAgentOfficialTools> {
  return {
    availableSkills: skills.map(({ description, name }) => ({
      description,
      name,
    })),
    primedFiles: buildPrimedFiles({
      agentsContent,
      projectRoot,
    }),
    tools: {
      bash: tool({
        description: [
          `Run a shell command inside the sandbox workspace at ${projectRoot}.`,
          SKILLS_AGENT_TOOL_PROMPT,
        ].join("\n\n"),
        execute: ({ command }) => session.runCommand(command),
        inputSchema: z.object({
          command: z
            .string()
            .min(1)
            .describe("Shell command to run from the sandbox project root."),
        }),
      }),
      readFile: tool({
        description: "Read a UTF-8 file from the sandbox workspace.",
        execute: async ({ path }) => ({
          content: await session.readFile(path),
          path,
        }),
        inputSchema: z.object({
          path: z
            .string()
            .min(1)
            .describe(
              "File path to read, relative to the sandbox project root unless absolute."
            ),
        }),
      }),
      skill: tool({
        description:
          "Load full SKILL.md instructions from the visible skills catalog.",
        execute: async ({ skillName }) => {
          try {
            const availableSkills = await session.discoverSkills(skills);
            const canonicalSkillName = resolveSkillNameAlias(
              availableSkills,
              skillName
            );
            const loadedSkill = await session.loadSkill(
              availableSkills,
              canonicalSkillName
            );

            return createLoadedSkillToolResult({
              availableSkills,
              loadedSkill,
              session,
            });
          } catch (error) {
            return createSkillToolError(error);
          }
        },
        inputSchema: z.object({
          skillName: z
            .string()
            .min(1)
            .describe("Name of the skill to load from the visible catalog."),
        }),
      }),
      writeFile: tool({
        description: "Write a UTF-8 file into the sandbox workspace.",
        execute: ({ content, path }) => session.writeFile(path, content),
        inputSchema: z.object({
          content: z.string().describe("UTF-8 file content to write."),
          path: z
            .string()
            .min(1)
            .describe(
              "File path to write, relative to the sandbox project root unless absolute."
            ),
        }),
      }),
    },
  };
}
