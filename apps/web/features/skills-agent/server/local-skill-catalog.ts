import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { VERCEL_SANDBOX_WORKSPACE_ROOT } from "@/features/shared/vercel-sandbox/server/session";
import {
  discoverSkills,
  type SkillMetadata,
  type SkillsSandbox,
} from "./skill-catalog";

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

  readdir(directory: string, opts?: { withFileTypes?: boolean }) {
    if (opts?.withFileTypes) {
      return readdir(directory, { withFileTypes: true });
    }

    return readdir(directory);
  }

  readFile(filePath: string, encoding: BufferEncoding | "utf-8") {
    return readFile(filePath, encoding);
  }
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
