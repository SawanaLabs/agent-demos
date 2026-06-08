import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import { SANDBOX_SKILLS_ROOT } from "./sandbox";
import type { SkillMetadata } from "./skill-catalog";

export interface FakeSandboxApiError extends Error {
  json?: unknown;
  response?: { status?: number };
  sandboxName?: string;
  sessionId?: string;
  text?: string;
}

class FakeSandboxFileSystem {
  readonly files = new Map<string, string>();
  readonly directories = new Set<string>();
  failMkdirCount = 0;
  failWriteCount = 0;

  exists(targetPath: string) {
    return Promise.resolve(
      this.files.has(targetPath) || this.directories.has(targetPath)
    );
  }

  mkdir(targetPath: string, options?: { recursive?: boolean }) {
    if (this.failMkdirCount > 0) {
      this.failMkdirCount -= 1;

      return Promise.reject(new Error("Status code 400 is not ok"));
    }

    this.directories.add(targetPath);

    if (options?.recursive) {
      let currentPath = targetPath;

      while (currentPath !== path.posix.dirname(currentPath)) {
        this.directories.add(currentPath);
        currentPath = path.posix.dirname(currentPath);
      }

      this.directories.add(currentPath);
    }

    return Promise.resolve();
  }

  readFile(targetPath: string, encoding: BufferEncoding | "utf-8") {
    if (encoding !== "utf-8") {
      throw new Error(`Unexpected encoding ${encoding}`);
    }

    const content = this.files.get(targetPath);

    if (!content) {
      throw new Error(`Missing fake sandbox file: ${targetPath}`);
    }

    return Promise.resolve(content);
  }

  writeFile(targetPath: string, content: string | Uint8Array) {
    if (this.failWriteCount > 0) {
      this.failWriteCount -= 1;

      return Promise.reject(new Error("Status code 400 is not ok"));
    }

    this.files.set(
      targetPath,
      typeof content === "string"
        ? content
        : Buffer.from(content).toString("utf-8")
    );

    return Promise.resolve();
  }
}

export class FakeSandbox {
  readonly fs = new FakeSandboxFileSystem();
  readonly commands: Array<{ command: string; cwd: string; sudo?: boolean }> =
    [];
  failRunCommandCount = 0;
  failRunCommandError: FakeSandboxApiError | null = null;
  failStopCount = 0;
  stopCount = 0;
  updateCalls: unknown[] = [];

  getSandboxSkillFiles() {
    return Array.from(this.fs.files.keys())
      .filter((filePath) => {
        if (!filePath.startsWith(`${SANDBOX_SKILLS_ROOT}/`)) {
          return false;
        }

        const relativePath = path.posix.relative(SANDBOX_SKILLS_ROOT, filePath);
        const pathParts = relativePath.split("/");

        return pathParts.length === 2 && pathParts[1] === "SKILL.md";
      })
      .sort((left, right) => left.localeCompare(right));
  }

  getSkillDirectoryFiles(skillDirectory: string) {
    return Array.from(this.fs.files.keys())
      .filter((filePath) => {
        if (!filePath.startsWith(`${skillDirectory}/`)) {
          return false;
        }

        return path.posix.basename(filePath) !== "SKILL.md";
      })
      .map((filePath) => path.posix.relative(skillDirectory, filePath))
      .sort((left, right) => left.localeCompare(right));
  }

  runFindCommand(script: string): string | null {
    if (
      script.includes(`find '${SANDBOX_SKILLS_ROOT}'`) &&
      script.includes("-name 'SKILL.md'")
    ) {
      return this.getSandboxSkillFiles().join("\n");
    }

    const listFilesMatch = script.match(/cd '([^']+)' && find \./);

    if (listFilesMatch?.[1]) {
      return this.getSkillDirectoryFiles(listFilesMatch[1]).join("\n");
    }

    return null;
  }

  runCommand(options: {
    args: string[];
    cmd: string;
    cwd: string;
    sudo?: boolean;
  }) {
    if (this.failRunCommandCount > 0) {
      this.failRunCommandCount -= 1;
      return Promise.reject(
        this.failRunCommandError ?? new Error("Status code 400 is not ok")
      );
    }

    const commandRecord: { command: string; cwd: string; sudo?: boolean } = {
      command: `${options.cmd} ${options.args.join(" ")}`,
      cwd: options.cwd,
    };

    if (options.sudo) {
      commandRecord.sudo = true;
    }

    this.commands.push(commandRecord);

    if (options.cmd === "bash" && options.args[0] === "-lc") {
      const script = options.args[1] ?? "";
      const syntaxCheck = spawnSync("bash", ["-n"], {
        encoding: "utf-8",
        input: script,
      });

      if (syntaxCheck.status !== 0) {
        return Promise.resolve({
          exitCode: syntaxCheck.status ?? 2,
          stderr: async () => syntaxCheck.stderr,
          stdout: async () => syntaxCheck.stdout,
        });
      }

      const match = script.match(shellFallbackWritePattern);

      if (match) {
        const [, targetPath, base64Content] = match;

        if (targetPath) {
          this.fs.files.set(
            targetPath,
            Buffer.from(base64Content ?? "", "base64").toString("utf-8")
          );
        }
      }

      const findStdout = this.runFindCommand(script);

      if (findStdout !== null) {
        return Promise.resolve({
          exitCode: 0,
          stderr: async () => "",
          stdout: async () => findStdout,
        });
      }
    }

    return Promise.resolve({
      exitCode: 0,
      stderr: async () => "",
      stdout: async () => "ok",
    });
  }

  stop() {
    this.stopCount += 1;

    if (this.failStopCount > 0) {
      this.failStopCount -= 1;
      return Promise.reject(new Error("sandbox stop failed"));
    }

    return Promise.resolve();
  }

  update(options: unknown) {
    this.updateCalls.push(options);
    return Promise.resolve();
  }
}

export const sandboxStopFailedErrorPattern = /sandbox stop failed/;
export const upstreamHttp400ErrorPattern = /HTTP 400/;
export const upstreamSandboxNamePattern = /sandbox-dev-1/;
export const upstreamSessionIdPattern = /vs-session-1/;

const temporaryDirectories: string[] = [];
const shellFallbackWritePattern =
  /base64 -d > '([^']+)' <<'__SKILLS_AGENT_CONTENT__'\n([\s\S]*?)\n__SKILLS_AGENT_CONTENT__/;

export function createApiLikeSandboxError(
  message = "Status code 400 is not ok"
): FakeSandboxApiError {
  const error = new Error(message) as FakeSandboxApiError;

  error.json = {
    code: "bad_request",
    detail: "The sandbox command payload was rejected by the upstream API.",
  };
  error.response = {
    status: 400,
  };
  error.sandboxName = "sandbox-dev-1";
  error.sessionId = "vs-session-1";
  error.text =
    '{"code":"bad_request","detail":"The sandbox command payload was rejected by the upstream API."}';

  return error;
}

export async function createWorkspaceFixture() {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "skills-agent-"));
  temporaryDirectories.push(workspaceRoot);

  await writeFile(path.join(workspaceRoot, "AGENTS.md"), "# Agents\n");
  await mkdir(path.join(workspaceRoot, ".agents/skills/grill-with-docs"), {
    recursive: true,
  });
  await writeFile(
    path.join(workspaceRoot, ".agents/skills/grill-with-docs/SKILL.md"),
    `---
name: grill-with-docs
description: Challenge an idea until the project context is precise.
---

# Grill With Docs

Ask sharp follow-up questions and update CONTEXT inline.
`
  );
  await writeFile(
    path.join(
      workspaceRoot,
      ".agents/skills/grill-with-docs/CONTEXT-FORMAT.md"
    ),
    "# Context Format\n"
  );

  return workspaceRoot;
}

export function createSampleSkills(workspaceRoot: string): SkillMetadata[] {
  return [
    {
      description: "Challenge an idea until the project context is precise.",
      name: "grill-with-docs",
      path: path.join(workspaceRoot, ".agents/skills/grill-with-docs"),
    },
  ];
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});
