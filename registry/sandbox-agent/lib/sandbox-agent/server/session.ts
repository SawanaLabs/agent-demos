import {
  getSandboxAgentEnv,
  getSandboxAgentSandboxSetupState,
  type SandboxAgentEnv,
} from "./env";
import type { VercelSandboxHandle } from "./vercel-sandbox";

export const SANDBOX_PROJECT_ROOT = "/vercel/sandbox/project";
export const SANDBOX_ARTIFACTS_ROOT = `${SANDBOX_PROJECT_ROOT}/artifacts`;

export const SANDBOX_AGENT_PREVIEW_PORT = 3000;
export const SANDBOX_AGENT_PREVIEW_SERVER_PATH =
  ".sandbox-agent-preview-server.mjs";

const SANDBOX_AGENT_PREVIEW_SERVER_SOURCE = String.raw`
import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const getArgValue = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const root = path.resolve(getArgValue("--root", "."));
const port = Number.parseInt(getArgValue("--port", "3000"), 10);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ts", "text/plain; charset=utf-8"],
]);

function getContentType(targetPath) {
  return contentTypes.get(path.extname(targetPath)) ?? "text/plain; charset=utf-8";
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  const relativePath = decodeURIComponent(requestUrl.pathname);
  const normalizedPath = path
    .normalize(relativePath)
    .replace(/^(\.\.(\/|\\\\|$))+/, "");
  const resolvedPath = path.join(
    root,
    normalizedPath === "/" ? "index.html" : normalizedPath
  );

  try {
    await access(resolvedPath);
    const fileStats = await stat(resolvedPath);

    if (fileStats.isDirectory()) {
      const directoryIndex = path.join(resolvedPath, "index.html");
      await access(directoryIndex);
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      createReadStream(directoryIndex).pipe(response);
      return;
    }

    response.setHeader("Content-Type", getContentType(resolvedPath));
    createReadStream(resolvedPath).pipe(response);
  } catch {
    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Not found");
  }
}).listen(port, "0.0.0.0");
`;

type NamedSandboxHandle = VercelSandboxHandle & {
  domain: (port: number) => string;
  runCommand(options: {
    args: string[];
    cmd: string;
    cwd: string;
    detached?: boolean;
  }): Promise<unknown>;
};

interface BaseSandboxSession {
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

interface BaseSandboxSessionRegistry {
  getSession(sessionId: string): BaseSandboxSession;
  stopSession(sessionId: string): Promise<void>;
}

interface DetachedPreviewSandboxHandle {
  runCommand(options: {
    args: string[];
    cmd: string;
    cwd: string;
    detached: true;
  }): Promise<unknown>;
}

export interface SandboxAgentPreview {
  directory: string;
  entryPath: string;
  port: number;
  url: string;
}

export interface SandboxAgentSession {
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
  startPreview(options?: {
    directory?: string;
    entryPath?: string;
    port?: number;
  }): Promise<SandboxAgentPreview>;
  stop(): Promise<void>;
  writeFile(
    targetPath: string,
    content: string
  ): Promise<{
    bytes: number;
    path: string;
  }>;
}

export interface SandboxAgentSessionRegistry {
  getDomain(sessionId: string, port: number): string;
  getSession(sessionId: string): SandboxAgentSession;
  stopSession(sessionId: string): Promise<void>;
}

interface SandboxAgentSessionRegistryOptions {
  localPreviewBaseUrl?: string;
}

function quoteShell(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function normalizeEntryPath(entryPath: string) {
  return entryPath.startsWith("/") ? entryPath : `/${entryPath}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPreviewLaunchScript({
  directory,
  port,
}: {
  directory: string;
  port: number;
}) {
  return `exec node ${quoteShell(SANDBOX_AGENT_PREVIEW_SERVER_PATH)} --root ${quoteShell(directory)} --port ${port} >/tmp/sandbox-agent-preview.log 2>&1`;
}

async function readPreviewLog(
  session: Pick<SandboxAgentSession, "runCommand">
) {
  const logResult = await session.runCommand(
    "cat /tmp/sandbox-agent-preview.log 2>/dev/null || true"
  );

  return logResult.stdout.trim();
}

export async function waitForSandboxPreview({
  entryPath,
  fetchPreview = globalThis.fetch,
  retries = 12,
  retryDelayMs = 1000,
  session,
  url,
}: {
  entryPath: string;
  fetchPreview?: typeof globalThis.fetch;
  retries?: number;
  retryDelayMs?: number;
  session: Pick<SandboxAgentSession, "runCommand">;
  url: string;
}) {
  let lastError = "";

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetchPreview(url, {
        cache: "no-store",
      });

      if (response.ok) {
        return;
      }

      const responseBody = await response.text().catch(() => "");
      lastError = [
        `HTTP ${response.status} ${response.statusText}`,
        responseBody.trim(),
      ]
        .filter(Boolean)
        .join(" ");
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Unknown preview fetch error";
    }

    if (attempt < retries - 1) {
      await sleep(retryDelayMs);
    }
  }

  const previewLog = await readPreviewLog(session);
  const details = [
    `Preview URL did not become reachable for "${entryPath}".`,
    lastError ? `Last probe error: ${lastError}` : null,
    previewLog ? `Preview log: ${previewLog}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  throw new Error(details);
}

export async function launchDetachedSandboxPreview({
  directory,
  port,
  sandbox,
  session,
}: {
  directory: string;
  port: number;
  sandbox: DetachedPreviewSandboxHandle;
  session: Pick<SandboxAgentSession, "runCommand">;
}) {
  await session.runCommand(
    `pkill -f ${quoteShell(SANDBOX_AGENT_PREVIEW_SERVER_PATH)} >/dev/null 2>&1 || true`
  );

  await sandbox.runCommand({
    args: ["-lc", buildPreviewLaunchScript({ directory, port })],
    cmd: "bash",
    cwd: SANDBOX_PROJECT_ROOT,
    detached: true,
  });
}

async function createVercelBackedSandboxAgentSessionRegistry(
  env: SandboxAgentEnv
): Promise<SandboxAgentSessionRegistry> {
  const {
    createVercelSandbox,
    createVercelSandboxSessionRegistry,
    VERCEL_SANDBOX_WORKSPACE_ROOT,
  } = await import("./vercel-sandbox");
  const sandboxHandles = new Map<string, NamedSandboxHandle>();
  const baseRegistry: BaseSandboxSessionRegistry =
    createVercelSandboxSessionRegistry({
      createSandbox: async (sessionId) => {
        const sandbox = await createVercelSandbox(sessionId, env, {
          ports: [SANDBOX_AGENT_PREVIEW_PORT],
        });
        sandboxHandles.set(
          sessionId,
          sandbox as unknown as NamedSandboxHandle
        );
        return sandbox;
      },
      workspaceRoot: VERCEL_SANDBOX_WORKSPACE_ROOT,
    });

  const registry: SandboxAgentSessionRegistry = {
    getDomain(sessionId, port) {
      const sandbox = sandboxHandles.get(sessionId);

      if (!sandbox) {
        throw new Error(
          `Sandbox handle for session "${sessionId}" is not available yet.`
        );
      }

      return sandbox.domain(port);
    },
    getSession(sessionId) {
      const baseSession = baseRegistry.getSession(sessionId);

      return {
        artifactsRoot: SANDBOX_ARTIFACTS_ROOT,
        projectRoot: SANDBOX_PROJECT_ROOT,
        pathExists: (targetPath) => baseSession.pathExists(targetPath),
        readFile: (targetPath) => baseSession.readFile(targetPath),
        runCommand: (command) => baseSession.runCommand(command),
        sessionId,
        async startPreview({
          directory = ".",
          entryPath = "/index.html",
          port = SANDBOX_AGENT_PREVIEW_PORT,
        } = {}) {
          const directoryExists = await baseSession.pathExists(directory);

          if (!directoryExists) {
            throw new Error(
              `Preview directory "${directory}" does not exist in the sandbox workspace.`
            );
          }

          await baseSession.writeFile(
            SANDBOX_AGENT_PREVIEW_SERVER_PATH,
            SANDBOX_AGENT_PREVIEW_SERVER_SOURCE
          );
          const sandbox = sandboxHandles.get(sessionId);

          if (!sandbox) {
            throw new Error(
              `Sandbox handle for session "${sessionId}" is not available when starting the preview server.`
            );
          }

          await launchDetachedSandboxPreview({
            directory,
            port,
            sandbox: sandbox as DetachedPreviewSandboxHandle,
            session: baseSession,
          });

          const preview = {
            directory,
            entryPath: normalizeEntryPath(entryPath),
            port,
            url: `${registry.getDomain(sessionId, port)}${normalizeEntryPath(entryPath)}`,
          };

          await waitForSandboxPreview({
            entryPath: preview.entryPath,
            session: baseSession,
            url: preview.url,
          });

          return preview;
        },
        stop: () => baseSession.stop(),
        writeFile: (targetPath, content) =>
          baseSession.writeFile(targetPath, content),
      };
    },
    stopSession(sessionId) {
      return baseRegistry.stopSession(sessionId);
    },
  };

  return registry;
}

export async function createSandboxAgentSessionRegistry(
  env: SandboxAgentEnv = getSandboxAgentEnv(),
  options: SandboxAgentSessionRegistryOptions = {}
): Promise<SandboxAgentSessionRegistry> {
  const setupState = getSandboxAgentSandboxSetupState(env);

  if (setupState.authMode === "local") {
    const { createLocalSandboxAgentSessionRegistry } =
      await import("./local-sandbox");

    return createLocalSandboxAgentSessionRegistry({
      localPreviewBaseUrl: options.localPreviewBaseUrl,
      previewPort: SANDBOX_AGENT_PREVIEW_PORT,
    });
  }

  return createVercelBackedSandboxAgentSessionRegistry(env);
}

let sharedRegistry: SandboxAgentSessionRegistry | null = null;
let sharedRegistryMode:
  | ReturnType<typeof getSandboxAgentSandboxSetupState>["authMode"]
  | null = null;
let sharedLocalPreviewBaseUrl: string | undefined;

export async function getSharedSandboxAgentSessionRegistry(
  env: SandboxAgentEnv = getSandboxAgentEnv(),
  options: SandboxAgentSessionRegistryOptions = {}
) {
  const setupState = getSandboxAgentSandboxSetupState(env);

  if (options.localPreviewBaseUrl) {
    sharedLocalPreviewBaseUrl = options.localPreviewBaseUrl;
  }

  if (!sharedRegistry || sharedRegistryMode !== setupState.authMode) {
    sharedRegistry = await createSandboxAgentSessionRegistry(env, {
      localPreviewBaseUrl: sharedLocalPreviewBaseUrl,
    });
    sharedRegistryMode = setupState.authMode;
  }

  return sharedRegistry;
}
