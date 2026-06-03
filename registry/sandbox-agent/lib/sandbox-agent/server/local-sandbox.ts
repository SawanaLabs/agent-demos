import { spawn } from "node:child_process";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  SANDBOX_PROJECT_ROOT,
  type SandboxAgentSessionRegistry,
} from "./session";

const localSandboxRoot = path.join(tmpdir(), "ai-sdk-sandbox-agent");
const commandTimeoutMs = 30_000;
const maxOutputBytes = 64 * 1024;

interface LocalSandboxAgentSessionRegistryOptions {
  localPreviewBaseUrl?: string;
  previewPort: number;
}

function sanitizeSessionId(sessionId: string) {
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 96);
}

function getSessionRoot(sessionId: string) {
  return path.join(localSandboxRoot, sanitizeSessionId(sessionId));
}

function isInsideDirectory(parent: string, child: string) {
  const relativePath = path.relative(parent, child);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function toLocalRelativePath(targetPath: string) {
  if (targetPath.startsWith(SANDBOX_PROJECT_ROOT)) {
    return path.relative(SANDBOX_PROJECT_ROOT, targetPath) || ".";
  }

  if (path.isAbsolute(targetPath)) {
    return targetPath.slice(1);
  }

  return targetPath;
}

function resolveLocalPath(projectRoot: string, targetPath: string) {
  const resolvedPath = path.resolve(projectRoot, toLocalRelativePath(targetPath));

  if (!isInsideDirectory(projectRoot, resolvedPath)) {
    throw new Error(`Sandbox path escapes the local workspace: ${targetPath}`);
  }

  return resolvedPath;
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

function normalizeEntryPath(entryPath: string) {
  return entryPath.startsWith("/") ? entryPath : `/${entryPath}`;
}

function buildLocalPreviewUrl(input: {
  directory: string;
  entryPath: string;
  localPreviewBaseUrl: string;
  sessionId: string;
}) {
  const normalizedDirectory =
    input.directory === "." ? "" : input.directory.replace(/^\/+/, "");
  const previewPath = path.posix.join(
    normalizedDirectory,
    normalizeEntryPath(input.entryPath).slice(1)
  );
  const url = new URL(
    [
      "/api/demos/sandbox-agent/local-preview",
      encodeURIComponent(input.sessionId),
      ...previewPath.split("/").filter(Boolean).map(encodeURIComponent),
    ].join("/"),
    input.localPreviewBaseUrl
  );

  return url.toString();
}

export function createLocalSandboxAgentSessionRegistry({
  localPreviewBaseUrl = "http://127.0.0.1:3000",
  previewPort,
}: LocalSandboxAgentSessionRegistryOptions): SandboxAgentSessionRegistry {
  return {
    getDomain() {
      return localPreviewBaseUrl;
    },
    getSession(sessionId) {
      const sessionRoot = getSessionRoot(sessionId);
      const projectRoot = path.join(sessionRoot, "project");
      const artifactsRoot = path.join(projectRoot, "artifacts");

      return {
        artifactsRoot,
        projectRoot,
        sessionId,
        async pathExists(targetPath) {
          return pathExists(resolveLocalPath(projectRoot, targetPath));
        },
        async readFile(targetPath) {
          return readFile(resolveLocalPath(projectRoot, targetPath), "utf-8");
        },
        async runCommand(command) {
          await mkdir(projectRoot, { recursive: true });
          await mkdir(artifactsRoot, { recursive: true });

          return runLocalCommand(command, projectRoot);
        },
        async startPreview({
          directory = ".",
          entryPath = "/index.html",
          port = previewPort,
        } = {}) {
          const previewDirectory = resolveLocalPath(projectRoot, directory);

          if (!(await pathExists(previewDirectory))) {
            throw new Error(
              `Preview directory "${directory}" does not exist in the local sandbox workspace.`
            );
          }

          const normalizedEntryPath = normalizeEntryPath(entryPath);
          const preview = {
            directory,
            entryPath: normalizedEntryPath,
            port,
            url: buildLocalPreviewUrl({
              directory,
              entryPath: normalizedEntryPath,
              localPreviewBaseUrl,
              sessionId,
            }),
          };

          return preview;
        },
        async stop() {
          await rm(sessionRoot, { force: true, recursive: true });
        },
        async writeFile(targetPath, content) {
          const resolvedPath = resolveLocalPath(projectRoot, targetPath);

          await mkdir(path.dirname(resolvedPath), { recursive: true });
          await writeFile(resolvedPath, content, "utf-8");

          return {
            bytes: Buffer.byteLength(content, "utf-8"),
            path: resolvedPath,
          };
        },
      };
    },
    async stopSession(sessionId) {
      await rm(getSessionRoot(sessionId), { force: true, recursive: true });
    },
  };
}
