import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  discoverSkills,
  type SkillMetadata,
  type SkillsSandbox,
} from "./skill-catalog";
import { VERCEL_SANDBOX_WORKSPACE_ROOT } from "./vercel-sandbox";

export const PRIMARY_SKILL_NAMES = [
  "grill-with-docs",
  "skill-creator",
] as const;

export const SKILLS_AGENT_WORKSPACE_ROOT = VERCEL_SANDBOX_WORKSPACE_ROOT;
const DEFAULT_SKILLS_DIRECTORY = path.join(
  SKILLS_AGENT_WORKSPACE_ROOT,
  ".agents/skills"
);

class LocalSkillCatalogSource implements SkillsSandbox {
  exec() {
    return Promise.resolve({
      stderr: "",
      stdout: "",
    });
  }

  async readdir(directory: string, opts?: { withFileTypes?: boolean }) {
    try {
      if (opts?.withFileTypes) {
        return await readdir(directory, { withFileTypes: true });
      }

      return await readdir(directory);
    } catch (error) {
      if (isMissingDirectoryError(error)) {
        return [];
      }

      throw error;
    }
  }

  readFile(filePath: string, encoding: BufferEncoding | "utf-8") {
    return readFile(filePath, encoding);
  }
}

function isMissingDirectoryError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export async function discoverWorkspaceSkills(
  directories: string[] = [DEFAULT_SKILLS_DIRECTORY]
): Promise<SkillMetadata[]> {
  const skills = await discoverSkills(
    new LocalSkillCatalogSource(),
    directories
  );
  const allowedNames = new Set(PRIMARY_SKILL_NAMES);

  return skills.filter((skill) => allowedNames.has(skill.name as never));
}
