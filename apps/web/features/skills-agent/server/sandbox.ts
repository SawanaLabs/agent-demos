import { readdir, readFile, stat } from "node:fs/promises";
import path, { posix as posixPath } from "node:path";

import { Sandbox } from "@vercel/sandbox";

import { SKILLS_AGENT_WORKSPACE_ROOT } from "./local-skill-catalog";
import {
  type LoadedSkill,
  loadSkill,
  type SkillMetadata,
} from "./skill-catalog";

export const SANDBOX_PROJECT_ROOT = "/vercel/sandbox/project";
export const SANDBOX_SKILLS_ROOT = `${SANDBOX_PROJECT_ROOT}/.agents/skills`;
export const SANDBOX_ARTIFACTS_ROOT = `${SANDBOX_PROJECT_ROOT}/artifacts`;
export const SANDBOX_AGENTS_FILE = `${SANDBOX_PROJECT_ROOT}/AGENTS.md`;

type DemoEnv = Record<string, string | undefined>;

interface SandboxFs {
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readFile(path: string, encoding: BufferEncoding | "utf-8"): Promise<string>;
  writeFile(
    path: string,
    content: string | Uint8Array,
    encoding?: BufferEncoding | "utf-8"
  ): Promise<void>;
}

export interface SkillsAgentSandboxHandle {
  fs: SandboxFs;
  runCommand(options: { args: string[]; cmd: string; cwd: string }): Promise<{
    exitCode: number;
    stderr(): Promise<string>;
    stdout(): Promise<string>;
  }>;
  stop(): Promise<unknown>;
}

export type SandboxFactory = (
  sessionId: string
) => Promise<SkillsAgentSandboxHandle>;

export interface SkillsAgentSandboxSetupState {
  authMode: "missing" | "oidc" | "token";
  isReady: boolean;
  issues: string[];
  providerLabel: "Vercel Sandbox";
  runtime: "node24";
}

export interface SkillsAgentSession {
  readonly activeSkillDirectory: string | null;
  readonly artifactsRoot: string;
  loadSkill(skills: SkillMetadata[], name: string): Promise<LoadedSkill>;
  pathExists(targetPath: string): Promise<boolean>;
  readonly projectRoot: string;
  readFile(targetPath: string): Promise<string>;
  runCommand(command: string): Promise<{
    command: string;
    exitCode: number;
    stderr: string;
    stdout: string;
  }>;
  readonly sessionId: string;
  stop(): Promise<void>;
  writeFile(
    targetPath: string,
    content: string
  ): Promise<{
    bytes: number;
    path: string;
  }>;
}

export interface SkillsAgentSessionRegistry {
  getSession(sessionId: string): SkillsAgentSession;
  stopSession(sessionId: string): Promise<void>;
}

interface SessionEntry {
  activeSkillDirectory: string | null;
  hydratedSkillNames: Set<string>;
  sandboxPromise: Promise<SkillsAgentSandboxHandle> | null;
  seededBaseWorkspace: boolean;
}

function hasTokenCredentials(env: DemoEnv) {
  return Boolean(
    env.VERCEL_PROJECT_ID && env.VERCEL_TEAM_ID && env.VERCEL_TOKEN
  );
}

function getTokenCredentials(env: DemoEnv) {
  const { VERCEL_PROJECT_ID, VERCEL_TEAM_ID, VERCEL_TOKEN } = env;

  if (!(VERCEL_PROJECT_ID && VERCEL_TEAM_ID && VERCEL_TOKEN)) {
    throw new Error(
      "Vercel Sandbox token credentials are incomplete. Expected VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID."
    );
  }

  return {
    projectId: VERCEL_PROJECT_ID,
    teamId: VERCEL_TEAM_ID,
    token: VERCEL_TOKEN,
  };
}

export function getSkillsAgentSandboxSetupState(
  env: DemoEnv = process.env
): SkillsAgentSandboxSetupState {
  const issues: string[] = [];
  const hasOidc = Boolean(env.VERCEL_OIDC_TOKEN);
  let authMode: SkillsAgentSandboxSetupState["authMode"] = "missing";

  if (hasOidc) {
    authMode = "oidc";
  } else if (hasTokenCredentials(env)) {
    authMode = "token";
  }

  if (authMode === "missing") {
    issues.push(
      "Vercel Sandbox credentials are missing. Add VERCEL_OIDC_TOKEN or the VERCEL_TOKEN, VERCEL_TEAM_ID, and VERCEL_PROJECT_ID trio."
    );
  }

  return {
    authMode,
    isReady: issues.length === 0,
    issues,
    providerLabel: "Vercel Sandbox",
    runtime: "node24",
  };
}

export async function createSkillsAgentSandbox(
  sessionId: string,
  env: DemoEnv = process.env
): Promise<SkillsAgentSandboxHandle> {
  const setupState = getSkillsAgentSandboxSetupState(env);

  if (!setupState.isReady) {
    throw new Error(setupState.issues.join(" "));
  }

  const baseOptions = {
    name: sessionId,
    persistent: true,
    runtime: setupState.runtime,
    timeout: 300_000,
  } as const;

  if (setupState.authMode === "oidc") {
    try {
      return (await Sandbox.get({
        name: sessionId,
      })) as unknown as SkillsAgentSandboxHandle;
    } catch {
      return (await Sandbox.create(
        baseOptions
      )) as unknown as SkillsAgentSandboxHandle;
    }
  }

  const tokenCredentials = getTokenCredentials(env);

  try {
    return (await Sandbox.get({
      name: sessionId,
      projectId: tokenCredentials.projectId,
      teamId: tokenCredentials.teamId,
      token: tokenCredentials.token,
    })) as unknown as SkillsAgentSandboxHandle;
  } catch {
    return (await Sandbox.create({
      ...baseOptions,
      projectId: tokenCredentials.projectId,
      teamId: tokenCredentials.teamId,
      token: tokenCredentials.token,
    })) as unknown as SkillsAgentSandboxHandle;
  }
}

async function pathExists(localPath: string) {
  try {
    await stat(localPath);
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

async function copyLocalPathToSandbox(
  sandbox: SkillsAgentSandboxHandle,
  localPath: string,
  remotePath: string
) {
  const entry = await stat(localPath);

  if (entry.isDirectory()) {
    await sandbox.fs.mkdir(remotePath, { recursive: true });

    for (const child of await readdir(localPath)) {
      await copyLocalPathToSandbox(
        sandbox,
        path.join(localPath, child),
        posixPath.join(remotePath, child)
      );
    }

    return;
  }

  await sandbox.fs.mkdir(posixPath.dirname(remotePath), { recursive: true });
  await sandbox.fs.writeFile(remotePath, await readFile(localPath));
}

function resolveSandboxPath(targetPath: string) {
  if (targetPath.startsWith("/")) {
    return targetPath;
  }

  return posixPath.join(SANDBOX_PROJECT_ROOT, targetPath);
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

  return resolveSandboxPath(targetPath);
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function formatSandboxError(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const details = [
    "response" in error &&
    typeof error.response === "object" &&
    error.response &&
    "status" in error.response &&
    typeof error.response.status === "number"
      ? `HTTP ${error.response.status}`
      : null,
    "sandboxName" in error && typeof error.sandboxName === "string"
      ? `sandbox=${error.sandboxName}`
      : null,
    "sessionId" in error && typeof error.sessionId === "string"
      ? `session=${error.sessionId}`
      : null,
    "json" in error && typeof error.json === "object" && error.json
      ? `json=${JSON.stringify(error.json)}`
      : null,
    "text" in error && typeof error.text === "string" && error.text
      ? `text=${error.text}`
      : null,
    error.message ? `message=${error.message}` : null,
  ].filter(Boolean);

  return details.join(" | ") || error.message;
}

function createSandboxOperationError({
  action,
  error,
  target,
}: {
  action: string;
  error: unknown;
  target: string;
}) {
  return new Error(
    `Sandbox ${action} failed for ${target}. ${formatSandboxError(error)}`
  );
}

export function createSkillsAgentSessionRegistry({
  createSandbox,
  workspaceRoot = SKILLS_AGENT_WORKSPACE_ROOT,
}: {
  createSandbox: SandboxFactory;
  workspaceRoot?: string;
}): SkillsAgentSessionRegistry {
  const entries = new Map<string, SessionEntry>();

  const stopSession = async (sessionId: string) => {
    const entry = entries.get(sessionId);

    if (!entry) {
      return;
    }

    if (!entry.sandboxPromise) {
      entries.delete(sessionId);
      return;
    }

    let sandbox: SkillsAgentSandboxHandle;

    try {
      sandbox = await entry.sandboxPromise;
    } catch {
      entries.delete(sessionId);
      return;
    }

    await sandbox.stop();
    entries.delete(sessionId);
  };

  const getOrCreateEntry = (sessionId: string) => {
    const existingEntry = entries.get(sessionId);

    if (existingEntry) {
      return existingEntry;
    }

    const createdEntry: SessionEntry = {
      activeSkillDirectory: null,
      hydratedSkillNames: new Set<string>(),
      sandboxPromise: null,
      seededBaseWorkspace: false,
    };
    entries.set(sessionId, createdEntry);
    return createdEntry;
  };

  const ensureSandbox = async (sessionId: string, entry: SessionEntry) => {
    if (!entry.sandboxPromise) {
      entry.sandboxPromise = (async () => {
        let lastError: unknown;

        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const sandbox = await createSandbox(sessionId);

            if (!entry.seededBaseWorkspace) {
              await sandbox.fs.mkdir(SANDBOX_PROJECT_ROOT, {
                recursive: true,
              });
              await sandbox.fs.mkdir(SANDBOX_SKILLS_ROOT, { recursive: true });
              await sandbox.fs.mkdir(SANDBOX_ARTIFACTS_ROOT, {
                recursive: true,
              });

              const agentsPath = path.join(workspaceRoot, "AGENTS.md");

              if (await pathExists(agentsPath)) {
                await copyLocalPathToSandbox(
                  sandbox,
                  agentsPath,
                  SANDBOX_AGENTS_FILE
                );
              }

              entry.seededBaseWorkspace = true;
            }

            return sandbox;
          } catch (error) {
            lastError = error;
            entry.seededBaseWorkspace = false;
          }
        }

        throw lastError;
      })().catch((error) => {
        entry.sandboxPromise = null;
        throw error;
      });
    }

    return await entry.sandboxPromise;
  };

  const ensureSkillHydrated = async (
    entry: SessionEntry,
    sandbox: SkillsAgentSandboxHandle,
    skill: SkillMetadata
  ) => {
    if (entry.hydratedSkillNames.has(skill.name)) {
      return;
    }

    await copyLocalPathToSandbox(
      sandbox,
      skill.path,
      posixPath.join(SANDBOX_SKILLS_ROOT, path.basename(skill.path))
    );
    entry.hydratedSkillNames.add(skill.name);
  };

  const writeSandboxFile = async (
    sandbox: SkillsAgentSandboxHandle,
    resolvedPath: string,
    content: string
  ) => {
    try {
      await sandbox.fs.mkdir(posixPath.dirname(resolvedPath), {
        recursive: true,
      });
      await sandbox.fs.writeFile(resolvedPath, content, "utf-8");
      return;
    } catch (primaryError) {
      const base64Content = Buffer.from(content, "utf-8").toString("base64");
      const fallbackCommand = [
        `mkdir -p ${shellQuote(posixPath.dirname(resolvedPath))}`,
        `base64 -d > ${shellQuote(resolvedPath)} <<'__SKILLS_AGENT_CONTENT__'`,
        base64Content,
        "__SKILLS_AGENT_CONTENT__",
      ].join("\n");

      let fallbackResult: Awaited<
        ReturnType<SkillsAgentSandboxHandle["runCommand"]>
      >;

      try {
        fallbackResult = await sandbox.runCommand({
          args: ["-lc", fallbackCommand],
          cmd: "bash",
          cwd: SANDBOX_PROJECT_ROOT,
        });
      } catch (fallbackError) {
        throw new Error(
          [
            `Sandbox writeFile failed for ${resolvedPath}.`,
            `File API error: ${formatSandboxError(primaryError)}`,
            `Shell fallback error: ${formatSandboxError(fallbackError)}`,
          ].join(" ")
        );
      }

      if (fallbackResult.exitCode === 0) {
        return;
      }

      throw new Error(
        [
          "Failed to write a sandbox file.",
          `File API error: ${formatSandboxError(primaryError)}`,
          `Shell fallback error: ${(await fallbackResult.stderr()).trim() || "unknown error"}`,
        ].join(" ")
      );
    }
  };

  return {
    getSession(sessionId: string): SkillsAgentSession {
      const entry = getOrCreateEntry(sessionId);

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

          const sandbox = await ensureSandbox(sessionId, entry);
          await ensureSkillHydrated(entry, sandbox, skill);

          return loadSkill(
            {
              exec: async () => ({
                stderr: "",
                stdout: "",
              }),
              readdir: async () => [],
              readFile: (filePath, encoding) =>
                sandbox.fs.readFile(filePath, encoding),
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
        async pathExists(targetPath) {
          const sandbox = await ensureSandbox(sessionId, entry);

          return sandbox.fs.exists(resolveSessionPath(entry, targetPath));
        },
        async readFile(targetPath) {
          const sandbox = await ensureSandbox(sessionId, entry);
          const resolvedPath = resolveSessionPath(entry, targetPath);

          try {
            return await sandbox.fs.readFile(resolvedPath, "utf-8");
          } catch (error) {
            throw createSandboxOperationError({
              action: "readFile",
              error,
              target: resolvedPath,
            });
          }
        },
        async runCommand(command) {
          const sandbox = await ensureSandbox(sessionId, entry);
          let result: Awaited<
            ReturnType<SkillsAgentSandboxHandle["runCommand"]>
          >;

          try {
            result = await sandbox.runCommand({
              args: ["-lc", command],
              cmd: "bash",
              cwd: SANDBOX_PROJECT_ROOT,
            });
          } catch (error) {
            throw createSandboxOperationError({
              action: "bash",
              error,
              target: command,
            });
          }

          return {
            command,
            exitCode: result.exitCode,
            stderr: await result.stderr(),
            stdout: await result.stdout(),
          };
        },
        async stop() {
          await stopSession(sessionId);
        },
        async writeFile(targetPath, content) {
          const sandbox = await ensureSandbox(sessionId, entry);
          const resolvedPath = resolveSessionPath(entry, targetPath);

          await writeSandboxFile(sandbox, resolvedPath, content);

          return {
            bytes: Buffer.byteLength(content, "utf-8"),
            path: resolvedPath,
          };
        },
      };
    },
    stopSession,
  };
}

let sharedRegistry: SkillsAgentSessionRegistry | null = null;

export function getSharedSkillsAgentSessionRegistry(
  env: DemoEnv = process.env
) {
  sharedRegistry ??= createSkillsAgentSessionRegistry({
    createSandbox: (sessionId) => createSkillsAgentSandbox(sessionId, env),
  });

  return sharedRegistry;
}
