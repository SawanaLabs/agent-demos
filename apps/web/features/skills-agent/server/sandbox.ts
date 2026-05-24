import path, { posix as posixPath } from "node:path";
import { env as appEnv } from "@/env";
import {
  getVercelSandboxSetupState,
  type VercelSandboxSetupState,
} from "@/features/shared/vercel-sandbox/server/env";
import {
  copyLocalPathToSandbox,
  createVercelSandbox,
  createVercelSandboxSessionRegistry,
  VERCEL_SANDBOX_AGENTS_FILE,
  VERCEL_SANDBOX_ARTIFACTS_ROOT,
  VERCEL_SANDBOX_PROJECT_ROOT,
  VERCEL_SANDBOX_SKILLS_ROOT,
  type VercelSandboxFactory,
  type VercelSandboxHandle,
  type VercelSandboxSession,
  type VercelSandboxSessionRegistry,
} from "@/features/shared/vercel-sandbox/server/session";
import { SKILLS_AGENT_WORKSPACE_ROOT } from "./local-skill-catalog";
import {
  type LoadedSkill,
  loadSkill,
  type SkillMetadata,
} from "./skill-catalog";

type DemoEnv = Record<string, string | undefined>;

export type SkillsAgentSandboxHandle = VercelSandboxHandle;
export type SandboxFactory = VercelSandboxFactory;
export type SkillsAgentSandboxSetupState = VercelSandboxSetupState;
export const SANDBOX_PROJECT_ROOT = VERCEL_SANDBOX_PROJECT_ROOT;
export const SANDBOX_SKILLS_ROOT = VERCEL_SANDBOX_SKILLS_ROOT;
export const SANDBOX_ARTIFACTS_ROOT = VERCEL_SANDBOX_ARTIFACTS_ROOT;
export const SANDBOX_AGENTS_FILE = VERCEL_SANDBOX_AGENTS_FILE;

export interface SkillsAgentSession extends VercelSandboxSession {
  readonly activeSkillDirectory: string | null;
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

export const createSkillsAgentSandbox = createVercelSandbox;
export const getSkillsAgentSandboxSetupState = getVercelSandboxSetupState;

export function createSkillsAgentSessionRegistry({
  createSandbox,
  workspaceRoot = SKILLS_AGENT_WORKSPACE_ROOT,
}: {
  createSandbox: SandboxFactory;
  workspaceRoot?: string;
}): SkillsAgentSessionRegistry {
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
        projectRoot: SANDBOX_PROJECT_ROOT,
        sessionId,
        async loadSkill(skills, name) {
          const skill = skills.find(
            (candidate) => candidate.name.toLowerCase() === name.toLowerCase()
          );

          if (!skill) {
            throw new Error(`Skill "${name}" was not found in the catalog.`);
          }

          await ensureSkillHydrated(entry, sessionId, skill);

          return loadSkill(
            {
              exec: async () => ({
                stderr: "",
                stdout: "",
              }),
              readdir: async () => [],
              readFile: (filePath, encoding) =>
                baseSession.readFile(filePath).then((content) => {
                  if (encoding !== "utf-8") {
                    throw new Error(`Unexpected encoding ${encoding}`);
                  }

                  return content;
                }),
            },
            [
              {
                ...skill,
                path: posixPath.join(
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

export function getSharedSkillsAgentSessionRegistry(env: DemoEnv = appEnv) {
  sharedRegistry ??= createSkillsAgentSessionRegistry({
    createSandbox: (sessionId) => createVercelSandbox(sessionId, env),
  });

  return sharedRegistry;
}
