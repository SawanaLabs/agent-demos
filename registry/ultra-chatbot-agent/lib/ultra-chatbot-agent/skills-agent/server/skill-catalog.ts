interface SkillDirent {
  isDirectory(): boolean;
  name: string;
}

export interface SkillsSandbox {
  exec(command: string): Promise<{ stderr: string; stdout: string }>;
  readdir(
    path: string,
    opts?: { withFileTypes?: boolean }
  ): Promise<SkillDirent[] | string[]>;
  readFile(path: string, encoding: BufferEncoding | "utf-8"): Promise<string>;
}

export interface SkillMetadata {
  description: string;
  name: string;
  path: string;
}

export interface LoadedSkill {
  content: string;
  name: string;
  skillDirectory: string;
}

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const trailingSlashPattern = /\/$/;
const frontmatterDescriptionPattern = /^description:\s*(.+)$/m;
const frontmatterNamePattern = /^name:\s*(.+)$/m;

function joinPath(directory: string, name: string) {
  return `${directory.replace(trailingSlashPattern, "")}/${name}`;
}

export function parseSkillMetadata(
  content: string
): Omit<SkillMetadata, "path"> | null {
  const match = content.match(frontmatterPattern);

  if (!match) {
    return null;
  }

  const frontmatter = match[1] ?? "";
  const name = frontmatter.match(frontmatterNamePattern)?.[1]?.trim();
  const description = frontmatter
    .match(frontmatterDescriptionPattern)?.[1]
    ?.trim();

  if (!(name && description)) {
    return null;
  }

  return {
    description,
    name,
  };
}

export function stripFrontmatter(content: string) {
  const match = content.match(frontmatterPattern);

  return match ? content.slice(match[0].length).trim() : content.trim();
}

export async function discoverSkills(
  sandbox: SkillsSandbox,
  directories: string[]
): Promise<SkillMetadata[]> {
  const seen = new Set<string>();
  const skills: SkillMetadata[] = [];

  for (const directory of directories) {
    const entries = (await sandbox.readdir(directory, {
      withFileTypes: true,
    })) as SkillDirent[];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillDirectory = joinPath(directory, entry.name);
      const skillFile = joinPath(skillDirectory, "SKILL.md");

      try {
        const content = await sandbox.readFile(skillFile, "utf-8");
        const metadata = parseSkillMetadata(content);

        if (!metadata || seen.has(metadata.name.toLowerCase())) {
          continue;
        }

        seen.add(metadata.name.toLowerCase());
        skills.push({
          ...metadata,
          path: skillDirectory,
        });
      } catch {
        // Ignore directories without a readable SKILL.md.
      }
    }
  }

  return skills.sort((left, right) => left.name.localeCompare(right.name));
}

export async function loadSkill(
  sandbox: SkillsSandbox,
  skills: SkillMetadata[],
  name: string
): Promise<LoadedSkill> {
  const skill = skills.find(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase()
  );

  if (!skill) {
    throw new Error(`Skill "${name}" was not found in the catalog.`);
  }

  const content = await sandbox.readFile(
    joinPath(skill.path, "SKILL.md"),
    "utf-8"
  );

  return {
    content: stripFrontmatter(content),
    name: skill.name,
    skillDirectory: skill.path,
  };
}
