import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path, { posix as posixPath } from "node:path";
import { Sandbox } from "@vercel/sandbox";
import {
  getSkillsAgentEnv,
  getSkillsAgentSandboxSetupState,
  getSkillsAgentSandboxTokenCredentials,
  type SkillsAgentEnv,
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
const VERCEL_SANDBOX_PYTHON_VERSION = "3.13";
const VERCEL_SANDBOX_PYTHON_PROJECT_NAME = "skills-agent-sandbox";

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
  fs: SandboxFs;
  runCommand(options: {
    args: string[];
    cmd: string;
    cwd: string;
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

interface SessionEntry {
  sandboxPromise: Promise<VercelSandboxHandle> | null;
  seededBaseWorkspace: boolean;
}

export async function createVercelSandbox(
  sessionId: string,
  env: SkillsAgentEnv = getSkillsAgentEnv(),
  options: {
    ports?: number[];
  } = {}
): Promise<VercelSandboxHandle> {
  const setupState = getSkillsAgentSandboxSetupState(env);

  if (!setupState.isReady) {
    throw new Error(setupState.issues.join(" "));
  }

  const baseOptions = {
    name: sessionId,
    persistent: true,
    ports: options.ports,
    runtime: setupState.runtime,
    timeout: 300_000,
  };

  if (setupState.authMode === "oidc") {
    try {
      return (await Sandbox.get({
        name: sessionId,
      })) as unknown as VercelSandboxHandle;
    } catch {
      return (await Sandbox.create(
        baseOptions
      )) as unknown as VercelSandboxHandle;
    }
  }

  const tokenCredentials = getSkillsAgentSandboxTokenCredentials(env);

  try {
    return (await Sandbox.get({
      name: sessionId,
      projectId: tokenCredentials.projectId,
      teamId: tokenCredentials.teamId,
      token: tokenCredentials.token,
    })) as unknown as VercelSandboxHandle;
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

function buildUvInstallCommand() {
  return [
    "set -euo pipefail",
    "if ! command -v curl >/dev/null 2>&1; then",
    "  dnf install -y curl",
    "fi",
    "if ! command -v uv >/dev/null 2>&1; then",
    "  curl --retry 1 --retry-delay 1 -LsSf https://astral.sh/uv/install.sh | env UV_UNMANAGED_INSTALL=/usr/local/bin sh",
    "fi",
    "uv --version",
  ].join("\n");
}

function buildPythonProjectBootstrapCommand() {
  return [
    "set -euo pipefail",
    "command -v uv >/dev/null 2>&1 || { echo 'uv is not available after sandbox bootstrap.' >&2; exit 127; }",
    "if [ -f pyproject.toml ] && [ -f .python-version ] && [ -d .venv ]; then",
    "  uv --version",
    "  exit 0",
    "fi",
    `uv python install ${VERCEL_SANDBOX_PYTHON_VERSION}`,
    "if [ ! -f pyproject.toml ]; then",
    `  uv init --bare --name ${VERCEL_SANDBOX_PYTHON_PROJECT_NAME} --python ${VERCEL_SANDBOX_PYTHON_VERSION}`,
    "fi",
    `uv python pin ${VERCEL_SANDBOX_PYTHON_VERSION}`,
    `uv venv .venv --python ${VERCEL_SANDBOX_PYTHON_VERSION} --allow-existing`,
    "uv run python --version",
  ].join("\n");
}

async function runSandboxBootstrapCommand({
  action,
  command,
  sandbox,
  sudo,
}: {
  action: string;
  command: string;
  sandbox: VercelSandboxHandle;
  sudo?: boolean;
}) {
  let result: Awaited<ReturnType<VercelSandboxHandle["runCommand"]>>;

  try {
    const commandOptions: Parameters<VercelSandboxHandle["runCommand"]>[0] = {
      args: ["-lc", command],
      cmd: "bash",
      cwd: VERCEL_SANDBOX_PROJECT_ROOT,
    };

    if (sudo) {
      commandOptions.sudo = true;
    }

    result = await sandbox.runCommand(commandOptions);
  } catch (error) {
    throw createSandboxOperationError({
      action,
      error,
      target: VERCEL_SANDBOX_PROJECT_ROOT,
    });
  }

  if (result.exitCode === 0) {
    return;
  }

  const stderr = (await result.stderr()).trim();
  const stdout = (await result.stdout()).trim();

  throw new Error(
    `Sandbox ${action} failed for ${VERCEL_SANDBOX_PROJECT_ROOT}. ${stderr || stdout || command}`
  );
}

async function bootstrapSandboxPythonProject(sandbox: VercelSandboxHandle) {
  await runSandboxBootstrapCommand({
    action: "uv install",
    command: buildUvInstallCommand(),
    sandbox,
    sudo: true,
  });
  await runSandboxBootstrapCommand({
    action: "Python project bootstrap",
    command: buildPythonProjectBootstrapCommand(),
    sandbox,
  });
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
  createSandbox,
  workspaceRoot = VERCEL_SANDBOX_WORKSPACE_ROOT,
}: {
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

              await bootstrapSandboxPythonProject(sandbox);
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
  env: SkillsAgentEnv = getSkillsAgentEnv()
) {
  sharedRegistry ??= createVercelSandboxSessionRegistry({
    createSandbox: (sessionId) => createVercelSandbox(sessionId, env),
  });

  return sharedRegistry;
}
