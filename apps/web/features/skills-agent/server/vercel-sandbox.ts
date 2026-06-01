import {
  copyLocalPathToSandbox as copySharedLocalPathToSandbox,
  createVercelSandbox as createSharedVercelSandbox,
  createVercelSandboxSessionRegistry as createSharedVercelSandboxSessionRegistry,
  VERCEL_SANDBOX_AGENTS_FILE as SHARED_VERCEL_SANDBOX_AGENTS_FILE,
  VERCEL_SANDBOX_ARTIFACTS_ROOT as SHARED_VERCEL_SANDBOX_ARTIFACTS_ROOT,
  VERCEL_SANDBOX_PROJECT_ROOT as SHARED_VERCEL_SANDBOX_PROJECT_ROOT,
  VERCEL_SANDBOX_SKILLS_ROOT as SHARED_VERCEL_SANDBOX_SKILLS_ROOT,
  VERCEL_SANDBOX_WORKSPACE_ROOT as SHARED_VERCEL_SANDBOX_WORKSPACE_ROOT,
  type VercelSandboxFactory,
  type VercelSandboxHandle,
  type VercelSandboxSessionBootstrap,
  type VercelSandboxSessionRegistry,
} from "@/features/shared/vercel-sandbox/server/session";
import { getSkillsAgentEnv, type SkillsAgentEnv } from "./env";

export type {
  VercelSandboxFactory,
  VercelSandboxHandle,
  VercelSandboxSession,
  VercelSandboxSessionRegistry,
} from "@/features/shared/vercel-sandbox/server/session";

export const copyLocalPathToSandbox = copySharedLocalPathToSandbox;
export const VERCEL_SANDBOX_AGENTS_FILE = SHARED_VERCEL_SANDBOX_AGENTS_FILE;
export const VERCEL_SANDBOX_ARTIFACTS_ROOT =
  SHARED_VERCEL_SANDBOX_ARTIFACTS_ROOT;
export const VERCEL_SANDBOX_PROJECT_ROOT = SHARED_VERCEL_SANDBOX_PROJECT_ROOT;
export const VERCEL_SANDBOX_SKILLS_ROOT = SHARED_VERCEL_SANDBOX_SKILLS_ROOT;
export const VERCEL_SANDBOX_WORKSPACE_ROOT =
  SHARED_VERCEL_SANDBOX_WORKSPACE_ROOT;

const VERCEL_SANDBOX_PYTHON_VERSION = "3.13";
const VERCEL_SANDBOX_PYTHON_PROJECT_NAME = "skills-agent-sandbox";

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
      cwd: SHARED_VERCEL_SANDBOX_PROJECT_ROOT,
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
    `Sandbox ${action} failed for ${SHARED_VERCEL_SANDBOX_PROJECT_ROOT}. ${
      stderr || stdout || command
    }`
  );
}

const bootstrapSandboxPythonProject: VercelSandboxSessionBootstrap = async ({
  sandbox,
}) => {
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
};

export function createVercelSandbox(
  sessionId: string,
  env: SkillsAgentEnv = getSkillsAgentEnv(),
  options: {
    ports?: number[];
  } = {}
): Promise<VercelSandboxHandle> {
  return createSharedVercelSandbox(sessionId, env, options);
}

export function createVercelSandboxSessionRegistry({
  createSandbox,
  workspaceRoot,
}: {
  createSandbox: VercelSandboxFactory;
  workspaceRoot?: string;
}): VercelSandboxSessionRegistry {
  return createSharedVercelSandboxSessionRegistry({
    bootstrapSandbox: bootstrapSandboxPythonProject,
    createSandbox,
    workspaceRoot,
  });
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
