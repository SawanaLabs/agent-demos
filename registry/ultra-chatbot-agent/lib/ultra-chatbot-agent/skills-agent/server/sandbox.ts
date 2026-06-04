import path, { posix as posixPath } from "node:path";
import type {
  VercelSandboxFactory,
  VercelSandboxHandle,
  VercelSandboxSession,
  VercelSandboxSessionRegistry,
} from "./vercel-sandbox";
import {
  getSkillsAgentEnv,
  getSkillsAgentSandboxSetupState as getSkillsAgentSandboxSetup,
  type SkillsAgentEnv,
} from "./env";
import { SKILLS_AGENT_WORKSPACE_ROOT } from "./local-skill-catalog";
import {
  type LoadedSkill,
  loadSkill,
  parseSkillMetadata,
  type SkillMetadata,
} from "./skill-catalog";

export type SkillsAgentSandboxHandle = VercelSandboxHandle;
export type SandboxFactory = VercelSandboxFactory;
export const SANDBOX_PROJECT_ROOT = "/vercel/sandbox/project";
export const SANDBOX_SKILLS_ROOT = `${SANDBOX_PROJECT_ROOT}/.agents/skills`;
export const SANDBOX_ARTIFACTS_ROOT = `${SANDBOX_PROJECT_ROOT}/artifacts`;
export const SANDBOX_AGENTS_FILE = `${SANDBOX_PROJECT_ROOT}/AGENTS.md`;

export interface SkillsAgentSession extends VercelSandboxSession {
  readonly activeSkillDirectory: string | null;
  discoverSkills(skills: SkillMetadata[]): Promise<SkillMetadata[]>;
  listSkillFiles(skillDirectory: string): Promise<string[]>;
  loadSkill(skills: SkillMetadata[], name: string): Promise<LoadedSkill>;
}

export interface SkillsAgentSessionRegistry {
  getSession(sessionId: string): SkillsAgentSession;
  stopSession(sessionId: string): Promise<void>;
}

interface SessionEntry {
  activeSkillDirectory: string | null;
  hydratedSkillNames: Set<string>;
}

function resolveSessionPath(entry: SessionEntry, targetPath: string) {
  if (targetPath.startsWith("/")) {
    return targetPath;
  }

  if (
    entry.activeSkillDirectory &&
    (targetPath === "." ||
      targetPath.startsWith("./") ||
      targetPath.startsWith("../"))
  ) {
    return posixPath.normalize(
      posixPath.join(entry.activeSkillDirectory, targetPath)
    );
  }

  return targetPath;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function isSandboxSkillPath(skillPath: string) {
  return (
    skillPath === SANDBOX_SKILLS_ROOT ||
    skillPath.startsWith(`${SANDBOX_SKILLS_ROOT}/`)
  );
}

function createSandboxSkillSource(baseSession: VercelSandboxSession) {
  return {
    exec: async () => ({
      stderr: "",
      stdout: "",
    }),
    readdir: async () => [],
    readFile: (filePath: string, encoding: BufferEncoding | "utf-8") =>
      baseSession.readFile(filePath).then((content) => {
        if (encoding !== "utf-8") {
          throw new Error(`Unexpected encoding ${encoding}`);
        }

        return content;
      }),
  };
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

async function discoverSandboxSkills(baseSession: VercelSandboxSession) {
  const command = [
    `if [ -d ${shellQuote(SANDBOX_SKILLS_ROOT)} ]; then`,
    `find ${shellQuote(SANDBOX_SKILLS_ROOT)} -mindepth 2 -maxdepth 2 -type f -name 'SKILL.md' -print`,
    "fi",
  ].join("\n");
  const result = await baseSession.runCommand(command);

  if (result.exitCode !== 0) {
    throw new Error(
      `Sandbox skill discovery failed. ${result.stderr.trim() || result.stdout.trim() || result.command}`
    );
  }

  const seen = new Set<string>();
  const skills: SkillMetadata[] = [];
  const skillFiles = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  for (const skillFile of skillFiles) {
    const content = await baseSession.readFile(skillFile);
    const metadata = parseSkillMetadata(content);

    if (!metadata) {
      continue;
    }

    const key = metadata.name.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    skills.push({
      ...metadata,
      path: posixPath.dirname(skillFile),
    });
  }

  return skills;
}

async function listSandboxSkillFiles(
  baseSession: VercelSandboxSession,
  skillDirectory: string
) {
  const command = [
    `if [ -d ${shellQuote(skillDirectory)} ]; then`,
    `cd ${shellQuote(skillDirectory)} && find . -type f ! -path './SKILL.md' -print | sed 's#^./##' | sort`,
    "fi",
  ].join("\n");
  const result = await baseSession.runCommand(command);

  if (result.exitCode !== 0) {
    throw new Error(
      `Sandbox skill file listing failed for ${skillDirectory}. ${result.stderr.trim() || result.stdout.trim() || result.command}`
    );
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export const getSkillsAgentSandboxSetupState = getSkillsAgentSandboxSetup;

export async function createSkillsAgentSandbox(
  sessionId: string,
  env: SkillsAgentEnv = getSkillsAgentEnv(),
  options: { ports?: number[] } = {}
): Promise<SkillsAgentSandboxHandle> {
  const { createVercelSandbox } = await import("./vercel-sandbox");

  return createVercelSandbox(sessionId, env, options);
}

export async function createSkillsAgentSessionRegistry({
  createSandbox,
  workspaceRoot = SKILLS_AGENT_WORKSPACE_ROOT,
}: {
  createSandbox: SandboxFactory;
  workspaceRoot?: string;
}): Promise<SkillsAgentSessionRegistry> {
  const { copyLocalPathToSandbox, createVercelSandboxSessionRegistry } =
    await import("./vercel-sandbox");
  const baseRegistry: VercelSandboxSessionRegistry =
    createVercelSandboxSessionRegistry({
      createSandbox,
      workspaceRoot,
    });
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

  const ensureSkillHydrated = async (
    entry: SessionEntry,
    sessionId: string,
    skill: SkillMetadata
  ) => {
    if (entry.hydratedSkillNames.has(skill.name)) {
      return;
    }

    const sandbox = await baseRegistry.getSandbox(sessionId);
    await copyLocalPathToSandbox(
      sandbox,
      skill.path,
      posixPath.join(SANDBOX_SKILLS_ROOT, path.basename(skill.path))
    );
    entry.hydratedSkillNames.add(skill.name);
  };

  return {
    getSession(sessionId) {
      const entry = getOrCreateEntry(sessionId);
      const baseSession = baseRegistry.getSession(sessionId);

      return {
        get activeSkillDirectory() {
          return entry.activeSkillDirectory;
        },
        artifactsRoot: SANDBOX_ARTIFACTS_ROOT,
        async discoverSkills(skills) {
          return mergeSkillCatalog(
            await discoverSandboxSkills(baseSession),
            skills
          );
        },
        listSkillFiles(skillDirectory) {
          return listSandboxSkillFiles(baseSession, skillDirectory);
        },
        projectRoot: SANDBOX_PROJECT_ROOT,
        sessionId,
        async loadSkill(skills, name) {
          const availableSkills = mergeSkillCatalog(
            await discoverSandboxSkills(baseSession),
            skills
          );
          const skill = findSkill(availableSkills, name);

          if (!skill) {
            throw new Error(`Skill "${name}" was not found in the catalog.`);
          }

          if (!isSandboxSkillPath(skill.path)) {
            await ensureSkillHydrated(entry, sessionId, skill);
          }

          return loadSkill(
            createSandboxSkillSource(baseSession),
            [
              {
                ...skill,
                path: isSandboxSkillPath(skill.path)
                  ? skill.path
                  : posixPath.join(
                      SANDBOX_SKILLS_ROOT,
                      path.basename(skill.path)
                    ),
              },
            ],
            name
          ).then((loadedSkill) => {
            entry.activeSkillDirectory = loadedSkill.skillDirectory;
            return loadedSkill;
          });
        },
        pathExists(targetPath) {
          return baseSession.pathExists(resolveSessionPath(entry, targetPath));
        },
        readFile(targetPath) {
          return baseSession.readFile(resolveSessionPath(entry, targetPath));
        },
        runCommand(command) {
          return baseSession.runCommand(command);
        },
        stop() {
          return baseRegistry.stopSession(sessionId);
        },
        writeFile(targetPath, content) {
          return baseSession.writeFile(
            resolveSessionPath(entry, targetPath),
            content
          );
        },
      };
    },
    async stopSession(sessionId) {
      await baseRegistry.stopSession(sessionId);
      entries.delete(sessionId);
    },
  };
}

let sharedRegistry: SkillsAgentSessionRegistry | null = null;
let sharedRegistryMode:
  | ReturnType<typeof getSkillsAgentSandboxSetup>["authMode"]
  | null = null;

export async function getSharedSkillsAgentSessionRegistry(
  env: SkillsAgentEnv = getSkillsAgentEnv()
) {
  const setupState = getSkillsAgentSandboxSetup(env);

  if (!sharedRegistry || sharedRegistryMode !== setupState.authMode) {
    if (setupState.authMode === "local") {
      const { createLocalSkillsAgentSessionRegistry } = await import(
        "./local-sandbox"
      );

      sharedRegistry = createLocalSkillsAgentSessionRegistry();
    } else {
      const { createVercelSandbox } = await import("./vercel-sandbox");

      sharedRegistry = await createSkillsAgentSessionRegistry({
        createSandbox: (sessionId) => createVercelSandbox(sessionId, env),
      });
    }

    sharedRegistryMode = setupState.authMode;
  }

  return sharedRegistry;
}
