import { spawn } from "node:child_process";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { SkillsAgentSessionRegistry } from "./sandbox";
import {
  discoverSkills,
  type LoadedSkill,
  loadSkill,
  type SkillMetadata,
  type SkillsSandbox,
} from "./skill-catalog";

const SANDBOX_PROJECT_ROOT = "/vercel/sandbox/project";
const SANDBOX_SKILLS_ROOT = `${SANDBOX_PROJECT_ROOT}/.agents/skills`;
const localSandboxRoot = path.join(
  /*turbopackIgnore: true*/ tmpdir(),
  "ai-sdk-skills-agent"
);
const commandTimeoutMs = 30_000;
const maxOutputBytes = 64 * 1024;

interface SessionEntry {
  activeSkillDirectory: string | null;
  hydratedSkillNames: Set<string>;
}

function sanitizeSessionId(sessionId: string) {
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 96);
}

function getSessionRoot(sessionId: string) {
  return path.join(
    /*turbopackIgnore: true*/ localSandboxRoot,
    sanitizeSessionId(sessionId)
  );
}

function isInsideDirectory(parent: string, child: string) {
  const relativePath = path.relative(parent, child);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function toProjectRelativePath(projectRoot: string, targetPath: string) {
  if (targetPath.startsWith(SANDBOX_PROJECT_ROOT)) {
    return path.relative(SANDBOX_PROJECT_ROOT, targetPath) || ".";
  }

  if (path.isAbsolute(targetPath)) {
    if (!isInsideDirectory(projectRoot, targetPath)) {
      throw new Error(`Sandbox path escapes the local workspace: ${targetPath}`);
    }

    return path.relative(projectRoot, targetPath) || ".";
  }

  return targetPath;
}

function resolveLocalPath(projectRoot: string, targetPath: string) {
  const resolvedPath = path.resolve(
    /*turbopackIgnore: true*/ projectRoot,
    toProjectRelativePath(projectRoot, targetPath)
  );

  if (!isInsideDirectory(projectRoot, resolvedPath)) {
    throw new Error(`Sandbox path escapes the local workspace: ${targetPath}`);
  }

  return resolvedPath;
}

function resolveSessionPath(
  entry: SessionEntry,
  projectRoot: string,
  targetPath: string
) {
  if (
    entry.activeSkillDirectory &&
    (targetPath === "." ||
      targetPath.startsWith("./") ||
      targetPath.startsWith("../"))
  ) {
    return path.resolve(
      /*turbopackIgnore: true*/ entry.activeSkillDirectory,
      targetPath
    );
  }

  return resolveLocalPath(projectRoot, targetPath);
}

async function pathExists(localPath: string) {
  try {
    await stat(/*turbopackIgnore: true*/ localPath);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

function appendBounded(current: string, chunk: Buffer) {
  const next = current + chunk.toString("utf-8");

  return next.length > maxOutputBytes ? next.slice(-maxOutputBytes) : next;
}

function runLocalCommand(command: string, cwd: string) {
  return new Promise<{
    command: string;
    exitCode: number;
    stderr: string;
    stdout: string;
  }>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const child = spawn("bash", ["-lc", command], {
      cwd,
      env: process.env,
    });
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, commandTimeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = appendBounded(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = appendBounded(stderr, chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        command,
        exitCode: timedOut ? 124 : (code ?? 1),
        stderr: timedOut
          ? [stderr, `Command timed out after ${commandTimeoutMs}ms.`]
              .filter(Boolean)
              .join("\n")
          : stderr,
        stdout,
      });
    });
  });
}

class LocalSkillCatalogSource implements SkillsSandbox {
  readdir(directory: string, opts?: { withFileTypes?: boolean }) {
    if (opts?.withFileTypes) {
      return readdir(/*turbopackIgnore: true*/ directory, {
        withFileTypes: true,
      });
    }

    return readdir(/*turbopackIgnore: true*/ directory);
  }

  readFile(filePath: string, encoding: BufferEncoding | "utf-8") {
    return readFile(/*turbopackIgnore: true*/ filePath, encoding);
  }

  exec() {
    return Promise.resolve({
      stderr: "",
      stdout: "",
    });
  }
}

async function copyLocalPathToLocalSandbox(
  localPath: string,
  sandboxPath: string
) {
  const entry = await stat(/*turbopackIgnore: true*/ localPath);

  if (entry.isDirectory()) {
    await writeDirectory(sandboxPath);

    for (const child of await readdir(/*turbopackIgnore: true*/ localPath)) {
      await copyLocalPathToLocalSandbox(
        path.join(/*turbopackIgnore: true*/ localPath, child),
        path.join(/*turbopackIgnore: true*/ sandboxPath, child)
      );
    }

    return;
  }

  await writeDirectory(path.dirname(sandboxPath));
  await writeFile(
    /*turbopackIgnore: true*/ sandboxPath,
    await readFile(/*turbopackIgnore: true*/ localPath)
  );
}

async function writeDirectory(directory: string) {
  await mkdir(/*turbopackIgnore: true*/ directory, { recursive: true });
}

function mergeSkillCatalog(
  primarySkills: SkillMetadata[],
  fallbackSkills: SkillMetadata[]
) {
  const seen = new Set<string>();
  const mergedSkills: SkillMetadata[] = [];

  for (const skill of [...primarySkills, ...fallbackSkills]) {
    const key = skill.name.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    mergedSkills.push(skill);
  }

  return mergedSkills;
}

function findSkill(skills: SkillMetadata[], name: string) {
  return skills.find(
    (candidate) => candidate.name.toLowerCase() === name.toLowerCase()
  );
}

function toLocalSandboxSkillPath(projectRoot: string, skill: SkillMetadata) {
  return path.join(
    /*turbopackIgnore: true*/ projectRoot,
    ".agents/skills",
    path.basename(skill.path)
  );
}

function isSandboxSkillPath(projectRoot: string, skillPath: string) {
  return (
    skillPath.startsWith(SANDBOX_SKILLS_ROOT) ||
    isInsideDirectory(
      path.join(/*turbopackIgnore: true*/ projectRoot, ".agents/skills"),
      skillPath
    )
  );
}

export function createLocalSkillsAgentSessionRegistry(): SkillsAgentSessionRegistry {
  const entries = new Map<string, SessionEntry>();

  const getOrCreateEntry = (sessionId: string) => {
    const existingEntry = entries.get(sessionId);

    if (existingEntry) {
      return existingEntry;
    }

    const createdEntry: SessionEntry = {
      activeSkillDirectory: null,
      hydratedSkillNames: new Set<string>(),
    };
    entries.set(sessionId, createdEntry);
    return createdEntry;
  };

  const discoverLocalSkills = async (projectRoot: string) => {
    const skillsDirectory = path.join(
      /*turbopackIgnore: true*/ projectRoot,
      ".agents/skills"
    );

    if (!(await pathExists(skillsDirectory))) {
      return [];
    }

    return discoverSkills(new LocalSkillCatalogSource(), [skillsDirectory]);
  };

  const ensureSkillHydrated = async (
    entry: SessionEntry,
    projectRoot: string,
    skill: SkillMetadata
  ) => {
    if (entry.hydratedSkillNames.has(skill.name)) {
      return;
    }

    const sandboxPath = toLocalSandboxSkillPath(projectRoot, skill);

    if (!isSandboxSkillPath(projectRoot, skill.path)) {
      await copyLocalPathToLocalSandbox(skill.path, sandboxPath);
    }

    entry.hydratedSkillNames.add(skill.name);
  };

  return {
    getSession(sessionId) {
      const entry = getOrCreateEntry(sessionId);
      const sessionRoot = getSessionRoot(sessionId);
      const projectRoot = path.join(
        /*turbopackIgnore: true*/ sessionRoot,
        "project"
      );
      const artifactsRoot = path.join(
        /*turbopackIgnore: true*/ projectRoot,
        "artifacts"
      );

      return {
        get activeSkillDirectory() {
          return entry.activeSkillDirectory;
        },
        artifactsRoot,
        async discoverSkills(skills) {
          return mergeSkillCatalog(await discoverLocalSkills(projectRoot), skills);
        },
        async listSkillFiles(skillDirectory) {
          const resolvedDirectory = resolveLocalPath(projectRoot, skillDirectory);

          if (!(await pathExists(resolvedDirectory))) {
            return [];
          }

          const files: string[] = [];
          const walk = async (directory: string) => {
            for (const child of await readdir(
              /*turbopackIgnore: true*/ directory,
              {
                withFileTypes: true,
              }
            )) {
              const childPath = path.join(
                /*turbopackIgnore: true*/ directory,
                child.name
              );

              if (child.isDirectory()) {
                await walk(childPath);
                continue;
              }

              if (child.isFile() && child.name !== "SKILL.md") {
                files.push(path.relative(resolvedDirectory, childPath));
              }
            }
          };

          await walk(resolvedDirectory);
          return files.sort((left, right) => left.localeCompare(right));
        },
        async loadSkill(skills, name): Promise<LoadedSkill> {
          const availableSkills = mergeSkillCatalog(
            await discoverLocalSkills(projectRoot),
            skills
          );
          const skill = findSkill(availableSkills, name);

          if (!skill) {
            throw new Error(`Skill "${name}" was not found in the catalog.`);
          }

          await ensureSkillHydrated(entry, projectRoot, skill);

          const localSkillPath = toLocalSandboxSkillPath(projectRoot, skill);
          const loadedSkill = await loadSkill(
            new LocalSkillCatalogSource(),
            [
              {
                ...skill,
                path: localSkillPath,
              },
            ],
            name
          );

          entry.activeSkillDirectory = loadedSkill.skillDirectory;
          return loadedSkill;
        },
        async pathExists(targetPath) {
          return pathExists(resolveSessionPath(entry, projectRoot, targetPath));
        },
        projectRoot,
        async readFile(targetPath) {
          return readFile(
            /*turbopackIgnore: true*/ resolveSessionPath(
              entry,
              projectRoot,
              targetPath
            ),
            "utf-8"
          );
        },
        async runCommand(command) {
          await writeDirectory(projectRoot);
          await writeDirectory(artifactsRoot);

          return runLocalCommand(command, projectRoot);
        },
        sessionId,
        async stop() {
          await rm(/*turbopackIgnore: true*/ sessionRoot, {
            force: true,
            recursive: true,
          });
        },
        async writeFile(targetPath, content) {
          const resolvedPath = resolveSessionPath(
            entry,
            projectRoot,
            targetPath
          );

          await writeDirectory(path.dirname(resolvedPath));
          await writeFile(
            /*turbopackIgnore: true*/ resolvedPath,
            content,
            "utf-8"
          );

          return {
            bytes: Buffer.byteLength(content, "utf-8"),
            path: resolvedPath,
          };
        },
      };
    },
    async stopSession(sessionId) {
      await rm(/*turbopackIgnore: true*/ getSessionRoot(sessionId), {
        force: true,
        recursive: true,
      });
      entries.delete(sessionId);
    },
  };
}
