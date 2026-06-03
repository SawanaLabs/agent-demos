import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path, { posix as posixPath } from "node:path";
import { Sandbox } from "@vercel/sandbox";
import { env as appEnv } from "@/env";
import { demoDataRetentionDays } from "@/features/shared/demo-data-retention/server/policy";
import {
  getVercelSandboxSetupState,
  getVercelSandboxTokenCredentials,
  type VercelSandboxEnv,
} from "./env";

function resolveVercelSandboxWorkspaceRoot() {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "AGENTS.md"))) {
      return candidate;
    }
  }

  return process.cwd();
}

export const VERCEL_SANDBOX_WORKSPACE_ROOT =
  resolveVercelSandboxWorkspaceRoot();
export const VERCEL_SANDBOX_PROJECT_ROOT = "/vercel/sandbox/project";
export const VERCEL_SANDBOX_SKILLS_ROOT = `${VERCEL_SANDBOX_PROJECT_ROOT}/.agents/skills`;
export const VERCEL_SANDBOX_ARTIFACTS_ROOT = `${VERCEL_SANDBOX_PROJECT_ROOT}/artifacts`;
export const VERCEL_SANDBOX_AGENTS_FILE = `${VERCEL_SANDBOX_PROJECT_ROOT}/AGENTS.md`;

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const VERCEL_SANDBOX_DEMO_APP_TAG = "ai-elements-demos";
export const VERCEL_SANDBOX_SNAPSHOT_EXPIRATION_MS =
  demoDataRetentionDays * millisecondsPerDay;
export const VERCEL_SANDBOX_KEEP_LAST_SNAPSHOTS = {
  count: 1,
  deleteEvicted: true,
  expiration: VERCEL_SANDBOX_SNAPSHOT_EXPIRATION_MS,
};

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

export interface VercelSandboxHandle {
  delete?(options?: { signal?: AbortSignal }): Promise<unknown>;
  fs: SandboxFs;
  runCommand(options: {
    args: string[];
    cmd: string;
    cwd: string;
    detached?: boolean;
    sudo?: boolean;
  }): Promise<{
    exitCode: number;
    stderr(): Promise<string>;
    stdout(): Promise<string>;
  }>;
  stop(): Promise<unknown>;
}

export type VercelSandboxFactory = (
  sessionId: string
) => Promise<VercelSandboxHandle>;

export interface VercelSandboxCreateOptions {
  keepLastSnapshots?: {
    count: number;
    deleteEvicted?: boolean;
    expiration?: number;
  };
  persistent?: boolean;
  ports?: number[];
  resources?: {
    vcpus: number;
  };
  snapshotExpiration?: number;
  tags?: Record<string, string>;
  timeout?: number;
}

interface VercelSandboxLifecycleOptions {
  keepLastSnapshots?: {
    count: number;
    deleteEvicted?: boolean;
    expiration?: number;
  };
  persistent: boolean;
  ports?: number[];
  resources?: {
    vcpus: number;
  };
  snapshotExpiration?: number;
  tags: Record<string, string>;
  timeout: number;
}

export interface VercelSandboxSession {
  readonly artifactsRoot: string;
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

export interface VercelSandboxSessionRegistry {
  getSandbox(sessionId: string): Promise<VercelSandboxHandle>;
  getSession(sessionId: string): VercelSandboxSession;
  stopSession(sessionId: string): Promise<void>;
}

export type VercelSandboxSessionBootstrap = (context: {
  projectRoot: string;
  sandbox: VercelSandboxHandle;
  sessionId: string;
  workspaceRoot: string;
}) => Promise<void>;

interface SessionEntry {
  sandboxPromise: Promise<VercelSandboxHandle> | null;
  seededBaseWorkspace: boolean;
}

function mergeVercelSandboxTags(tags: Record<string, string> = {}) {
  const mergedTags = {
    ...tags,
    app: VERCEL_SANDBOX_DEMO_APP_TAG,
    retention: `${demoDataRetentionDays}d`,
  };

  if (Object.keys(mergedTags).length > 5) {
    throw new Error(
      "Vercel Sandbox supports at most 5 tags. Keep demo sandbox custom tags to 3 or fewer."
    );
  }

  return mergedTags;
}

function buildVercelSandboxLifecycleOptions(
  options: VercelSandboxCreateOptions
): VercelSandboxLifecycleOptions {
  const persistent = options.persistent ?? true;
  const lifecycleOptions: VercelSandboxLifecycleOptions = {
    persistent,
    tags: mergeVercelSandboxTags(options.tags),
    timeout: options.timeout ?? 300_000,
  };

  if (persistent) {
    lifecycleOptions.snapshotExpiration =
      options.snapshotExpiration ?? VERCEL_SANDBOX_SNAPSHOT_EXPIRATION_MS;
    lifecycleOptions.keepLastSnapshots =
      options.keepLastSnapshots ?? VERCEL_SANDBOX_KEEP_LAST_SNAPSHOTS;
  }

  if (options.ports) {
    lifecycleOptions.ports = options.ports;
  }

  if (options.resources) {
    lifecycleOptions.resources = options.resources;
  }

  return lifecycleOptions;
}

export async function createVercelSandbox(
  sessionId: string,
  env: VercelSandboxEnv = appEnv,
  options: VercelSandboxCreateOptions = {}
): Promise<VercelSandboxHandle> {
  const setupState = getVercelSandboxSetupState(env);

  if (!setupState.isReady) {
    throw new Error(setupState.issues.join(" "));
  }

  const lifecycleOptions = buildVercelSandboxLifecycleOptions(options);
  const baseOptions: VercelSandboxLifecycleOptions & {
    name: string;
    runtime: typeof setupState.runtime;
  } = {
    ...lifecycleOptions,
    name: sessionId,
    runtime: setupState.runtime,
  };

  if (setupState.authMode === "oidc") {
    try {
      const sandbox = await Sandbox.get({
        name: sessionId,
      });
      await sandbox.update(lifecycleOptions);
      return sandbox as unknown as VercelSandboxHandle;
    } catch {
      return (await Sandbox.create(
        baseOptions
      )) as unknown as VercelSandboxHandle;
    }
  }

  const tokenCredentials = getVercelSandboxTokenCredentials(env);

  try {
    const sandbox = await Sandbox.get({
      name: sessionId,
      projectId: tokenCredentials.projectId,
      teamId: tokenCredentials.teamId,
      token: tokenCredentials.token,
    });
    await sandbox.update(lifecycleOptions);
    return sandbox as unknown as VercelSandboxHandle;
  } catch {
    return (await Sandbox.create({
      ...baseOptions,
      projectId: tokenCredentials.projectId,
      teamId: tokenCredentials.teamId,
      token: tokenCredentials.token,
    })) as unknown as VercelSandboxHandle;
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

export async function copyLocalPathToSandbox(
  sandbox: VercelSandboxHandle,
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

  return posixPath.join(VERCEL_SANDBOX_PROJECT_ROOT, targetPath);
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

async function writeSandboxFile(
  sandbox: VercelSandboxHandle,
  resolvedPath: string,
  content: string
) {
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

    let fallbackResult: Awaited<ReturnType<VercelSandboxHandle["runCommand"]>>;

    try {
      fallbackResult = await sandbox.runCommand({
        args: ["-lc", fallbackCommand],
        cmd: "bash",
        cwd: VERCEL_SANDBOX_PROJECT_ROOT,
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
}

export function createVercelSandboxSessionRegistry({
  bootstrapSandbox,
  createSandbox,
  workspaceRoot = VERCEL_SANDBOX_WORKSPACE_ROOT,
}: {
  bootstrapSandbox?: VercelSandboxSessionBootstrap;
  createSandbox: VercelSandboxFactory;
  workspaceRoot?: string;
}): VercelSandboxSessionRegistry {
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

    let sandbox: VercelSandboxHandle;

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
              await sandbox.fs.mkdir(VERCEL_SANDBOX_PROJECT_ROOT, {
                recursive: true,
              });
              await sandbox.fs.mkdir(VERCEL_SANDBOX_SKILLS_ROOT, {
                recursive: true,
              });
              await sandbox.fs.mkdir(VERCEL_SANDBOX_ARTIFACTS_ROOT, {
                recursive: true,
              });

              const agentsPath = path.join(workspaceRoot, "AGENTS.md");

              if (await pathExists(agentsPath)) {
                await copyLocalPathToSandbox(
                  sandbox,
                  agentsPath,
                  VERCEL_SANDBOX_AGENTS_FILE
                );
              }

              await bootstrapSandbox?.({
                projectRoot: VERCEL_SANDBOX_PROJECT_ROOT,
                sandbox,
                sessionId,
                workspaceRoot,
              });

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

  return {
    getSandbox(sessionId) {
      const entry = getOrCreateEntry(sessionId);
      return ensureSandbox(sessionId, entry);
    },
    getSession(sessionId) {
      const entry = getOrCreateEntry(sessionId);

      return {
        artifactsRoot: VERCEL_SANDBOX_ARTIFACTS_ROOT,
        projectRoot: VERCEL_SANDBOX_PROJECT_ROOT,
        sessionId,
        async pathExists(targetPath) {
          const sandbox = await ensureSandbox(sessionId, entry);
          return sandbox.fs.exists(resolveSandboxPath(targetPath));
        },
        async readFile(targetPath) {
          const sandbox = await ensureSandbox(sessionId, entry);
          const resolvedPath = resolveSandboxPath(targetPath);

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
          let result: Awaited<ReturnType<VercelSandboxHandle["runCommand"]>>;

          try {
            result = await sandbox.runCommand({
              args: ["-lc", command],
              cmd: "bash",
              cwd: VERCEL_SANDBOX_PROJECT_ROOT,
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
          const resolvedPath = resolveSandboxPath(targetPath);

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

let sharedRegistry: VercelSandboxSessionRegistry | null = null;

export function getSharedVercelSandboxSessionRegistry(
  env: VercelSandboxEnv = appEnv
) {
  sharedRegistry ??= createVercelSandboxSessionRegistry({
    createSandbox: (sessionId) => createVercelSandbox(sessionId, env),
  });

  return sharedRegistry;
}
