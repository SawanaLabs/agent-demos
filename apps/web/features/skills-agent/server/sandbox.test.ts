import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Sandbox } from "@vercel/sandbox";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  VERCEL_SANDBOX_DEMO_APP_TAG,
  VERCEL_SANDBOX_KEEP_LAST_SNAPSHOTS,
  VERCEL_SANDBOX_SNAPSHOT_EXPIRATION_MS,
} from "@/features/shared/vercel-sandbox/server/session";
import {
  createSkillsAgentSandbox,
  createSkillsAgentSessionRegistry,
  SANDBOX_AGENTS_FILE,
  SANDBOX_ARTIFACTS_ROOT,
  SANDBOX_PROJECT_ROOT,
  SANDBOX_SKILLS_ROOT,
  type SandboxFactory,
} from "./sandbox";
import type { SkillMetadata } from "./skill-catalog";

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

type FakeSandboxApiError = Error & {
  json?: unknown;
  response?: { status?: number };
  sandboxName?: string;
  sessionId?: string;
  text?: string;
};

class FakeSandbox {
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

const temporaryDirectories: string[] = [];
const shellFallbackWritePattern =
  /base64 -d > '([^']+)' <<'__SKILLS_AGENT_CONTENT__'\n([\s\S]*?)\n__SKILLS_AGENT_CONTENT__/;
const sandboxStopFailedErrorPattern = /sandbox stop failed/;
const upstreamHttp400ErrorPattern = /HTTP 400/;
const upstreamSandboxNamePattern = /sandbox-dev-1/;
const upstreamSessionIdPattern = /vs-session-1/;

function createApiLikeSandboxError(
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

async function createWorkspaceFixture() {
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

function createSampleSkills(workspaceRoot: string): SkillMetadata[] {
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

describe("skills agent sandbox session registry", () => {
  it("creates one sandbox per chat session and loads skills lazily", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    const createSandbox: SandboxFactory = () => {
      const sandbox = new FakeSandbox();
      sandboxes.push(sandbox);
      return Promise.resolve(sandbox as never);
    };
    const registry = createSkillsAgentSessionRegistry({
      createSandbox,
      workspaceRoot,
    });

    const firstSession = registry.getSession("chat-1");
    const secondHandleToSameSession = registry.getSession("chat-1");

    expect(sandboxes).toHaveLength(0);

    const loadedSkill = await firstSession.loadSkill(
      sampleSkills,
      "grill-with-docs"
    );

    expect(loadedSkill.name).toBe("grill-with-docs");
    expect(loadedSkill.skillDirectory).toBe(
      `${SANDBOX_SKILLS_ROOT}/grill-with-docs`
    );
    expect(sandboxes).toHaveLength(1);

    const sandbox = sandboxes[0];

    if (!sandbox) {
      throw new Error("Expected the first session to create a sandbox.");
    }

    expect(await sandbox.fs.readFile(SANDBOX_AGENTS_FILE, "utf-8")).toContain(
      "# Agents"
    );
    expect(
      await sandbox.fs.readFile(
        `${SANDBOX_SKILLS_ROOT}/grill-with-docs/SKILL.md`,
        "utf-8"
      )
    ).toContain("Grill With Docs");
    expect(
      sandbox.fs.files.get(path.posix.join(SANDBOX_PROJECT_ROOT, "CONTEXT.md"))
    ).toBeUndefined();

    await secondHandleToSameSession.loadSkill(sampleSkills, "grill-with-docs");
    await expect(
      firstSession.readFile("./CONTEXT-FORMAT.md")
    ).resolves.toContain("# Context Format");
    await expect(firstSession.pathExists("CONTEXT.md")).resolves.toBe(false);
    await firstSession.writeFile(
      "artifacts/CONTEXT.md",
      "# Context\n\nDrafted from the sandbox session.\n"
    );
    const readBack = await secondHandleToSameSession.readFile(
      "artifacts/CONTEXT.md"
    );

    expect(readBack).toContain("Drafted from the sandbox session.");
    expect(sandboxes).toHaveLength(1);
    expect(
      await sandbox.fs.readFile(`${SANDBOX_ARTIFACTS_ROOT}/CONTEXT.md`, "utf-8")
    ).toContain("Drafted from the sandbox session.");
  });

  it("creates one named sandbox lazily for filesystem tools without loading a skill", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sandboxes: FakeSandbox[] = [];
    const requestedSessionIds: string[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: (sessionId) => {
        requestedSessionIds.push(sessionId);
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    const firstHandle = registry.getSession("chat-1");
    const secondHandle = registry.getSession("chat-1");

    await expect(
      firstHandle.writeFile("artifacts/CONTEXT.md", "# Draft")
    ).resolves.toMatchObject({
      path: `${SANDBOX_ARTIFACTS_ROOT}/CONTEXT.md`,
    });
    await expect(secondHandle.readFile("artifacts/CONTEXT.md")).resolves.toBe(
      "# Draft"
    );
    await expect(secondHandle.readFile("AGENTS.md")).resolves.toContain(
      "# Agents"
    );
    await expect(firstHandle.pathExists("CONTEXT.md")).resolves.toBe(false);

    expect(requestedSessionIds).toEqual(["chat-1"]);
    expect(sandboxes).toHaveLength(1);
  });

  it("bootstraps uv and a Python project in the sandbox root", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    await registry.getSession("chat-1").readFile("AGENTS.md");

    const uvInstallCommand = sandboxes[0]?.commands.find(({ command }) =>
      command.includes("UV_UNMANAGED_INSTALL=/usr/local/bin")
    );
    const pythonBootstrapCommand = sandboxes[0]?.commands.find(({ command }) =>
      command.includes(
        "uv init --bare --name skills-agent-sandbox --python 3.13"
      )
    );

    expect(uvInstallCommand).toMatchObject({
      cwd: SANDBOX_PROJECT_ROOT,
      sudo: true,
    });
    expect(uvInstallCommand?.command).toContain("dnf install -y curl");
    expect(pythonBootstrapCommand).toMatchObject({
      cwd: SANDBOX_PROJECT_ROOT,
    });
    expect(pythonBootstrapCommand?.sudo).toBeUndefined();
    expect(pythonBootstrapCommand?.command).toContain("uv python install 3.13");
    expect(pythonBootstrapCommand?.command).toContain("uv python pin 3.13");
    expect(pythonBootstrapCommand?.command).toContain(
      "uv venv .venv --python 3.13 --allow-existing"
    );
    expect(pythonBootstrapCommand?.command).not.toContain("VIRTUAL_ENV");
    expect(pythonBootstrapCommand?.command).not.toContain("UV_CACHE_DIR");
  });

  it("loads a skill that was installed into the sandbox after session creation", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });
    const session = registry.getSession("chat-1");

    await session.writeFile(
      ".agents/skills/word-skill/SKILL.md",
      `---
name: word-skill
description: Work with Word documents.
---

# Word Skill

Use this workflow for Word documents.
`
    );
    await session.writeFile(
      ".agents/skills/word-skill/references/word.md",
      "# Word Reference\n"
    );

    await expect(session.loadSkill([], "word-skill")).resolves.toEqual({
      content: "# Word Skill\n\nUse this workflow for Word documents.",
      name: "word-skill",
      skillDirectory: `${SANDBOX_SKILLS_ROOT}/word-skill`,
    });
    await expect(session.readFile("./references/word.md")).resolves.toBe(
      "# Word Reference\n"
    );
    await expect(
      session.listSkillFiles(`${SANDBOX_SKILLS_ROOT}/word-skill`)
    ).resolves.toEqual(["references/word.md"]);
  });

  it("falls back to a shell write when the sandbox file API rejects a write", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    const session = registry.getSession("chat-1");
    await session.loadSkill(sampleSkills, "grill-with-docs");
    const sandbox = sandboxes[0];

    if (!sandbox) {
      throw new Error("Expected the session to create a sandbox.");
    }

    sandbox.fs.failWriteCount = 1;
    await expect(
      session.writeFile(
        "artifacts/CONTEXT.md",
        "# Context\n\nWritten through the shell fallback.\n"
      )
    ).resolves.toMatchObject({
      path: `${SANDBOX_ARTIFACTS_ROOT}/CONTEXT.md`,
    });
    await expect(session.readFile("artifacts/CONTEXT.md")).resolves.toContain(
      "Written through the shell fallback."
    );
    expect(
      sandboxes[0]?.commands.some(({ command }) =>
        command.includes("base64 -d")
      )
    ).toBe(true);
  });

  it("falls back to a shell write when the sandbox file API rejects mkdir", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    const session = registry.getSession("chat-1");
    await session.loadSkill(sampleSkills, "grill-with-docs");
    const sandbox = sandboxes[0];

    if (!sandbox) {
      throw new Error("Expected the session to create a sandbox.");
    }

    sandbox.fs.failMkdirCount = 1;
    await expect(
      session.writeFile(
        "docs/adr/0001-sample.md",
        "# ADR 1\n\nDocumented through the shell fallback.\n"
      )
    ).resolves.toMatchObject({
      path: `${SANDBOX_PROJECT_ROOT}/docs/adr/0001-sample.md`,
    });
    await expect(
      session.readFile("docs/adr/0001-sample.md")
    ).resolves.toContain("Documented through the shell fallback.");
    expect(
      sandboxes[0]?.commands.some(({ command }) =>
        command.includes("base64 -d")
      )
    ).toBe(true);
  });

  it("surfaces rich upstream details when the shell fallback write also fails", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    const session = registry.getSession("chat-1");
    await session.loadSkill(sampleSkills, "grill-with-docs");
    const sandbox = sandboxes[0];

    if (!sandbox) {
      throw new Error("Expected the session to create a sandbox.");
    }

    sandbox.fs.failWriteCount = 1;
    sandbox.failRunCommandCount = 1;
    sandbox.failRunCommandError = createApiLikeSandboxError();

    const writeError = await session
      .writeFile(
        "artifacts/CONTEXT.md",
        "# Context\n\nThis write should expose the upstream API error.\n"
      )
      .catch((error: unknown) => error);

    expect(writeError).toBeInstanceOf(Error);
    expect((writeError as Error).message).toMatch(upstreamHttp400ErrorPattern);
    expect((writeError as Error).message).toMatch(upstreamSandboxNamePattern);
    expect((writeError as Error).message).toMatch(upstreamSessionIdPattern);
  });

  it("surfaces rich upstream details when bash command execution fails", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    const session = registry.getSession("chat-1");
    await session.loadSkill(sampleSkills, "grill-with-docs");
    const sandbox = sandboxes[0];

    if (!sandbox) {
      throw new Error("Expected the session to create a sandbox.");
    }

    sandbox.failRunCommandCount = 1;
    sandbox.failRunCommandError = createApiLikeSandboxError();

    const commandError = await session
      .runCommand("pwd")
      .catch((error: unknown) => error);

    expect(commandError).toBeInstanceOf(Error);
    expect((commandError as Error).message).toMatch(
      upstreamHttp400ErrorPattern
    );
    expect((commandError as Error).message).toMatch(upstreamSandboxNamePattern);
    expect((commandError as Error).message).toMatch(upstreamSessionIdPattern);
  });

  it("retries sandbox creation once and does not poison the chat session", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    let attempts = 0;
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        attempts += 1;

        if (attempts === 1) {
          return Promise.reject(
            new Error("temporary sandbox bootstrap failure")
          );
        }

        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    const loadedSkill = await registry
      .getSession("chat-1")
      .loadSkill(sampleSkills, "grill-with-docs");

    expect(loadedSkill.name).toBe("grill-with-docs");
    expect(attempts).toBe(2);
    expect(sandboxes).toHaveLength(1);
  });

  it("keeps sandbox instances isolated across chat ids", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    await registry
      .getSession("chat-1")
      .loadSkill(sampleSkills, "grill-with-docs");
    await registry
      .getSession("chat-2")
      .loadSkill(sampleSkills, "grill-with-docs");

    expect(sandboxes).toHaveLength(2);
  });

  it("keeps the session registered if sandbox shutdown fails", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sampleSkills = createSampleSkills(workspaceRoot);
    const sandboxes: FakeSandbox[] = [];
    const registry = createSkillsAgentSessionRegistry({
      createSandbox: () => {
        const sandbox = new FakeSandbox();
        sandbox.failStopCount = 1;
        sandboxes.push(sandbox);
        return Promise.resolve(sandbox as never);
      },
      workspaceRoot,
    });

    const session = registry.getSession("chat-1");
    await session.loadSkill(sampleSkills, "grill-with-docs");

    await expect(registry.stopSession("chat-1")).rejects.toThrow(
      sandboxStopFailedErrorPattern
    );
    await expect(session.readFile("AGENTS.md")).resolves.toContain("# Agents");
    await expect(registry.stopSession("chat-1")).resolves.toBeUndefined();

    expect(sandboxes[0]?.stopCount).toBe(2);
  });

  it("does not schedule an application-level idle stop", async () => {
    vi.useFakeTimers();

    try {
      const workspaceRoot = await createWorkspaceFixture();
      const sampleSkills = createSampleSkills(workspaceRoot);
      const sandboxes: FakeSandbox[] = [];
      const registry = createSkillsAgentSessionRegistry({
        createSandbox: () => {
          const sandbox = new FakeSandbox();
          sandboxes.push(sandbox);
          return Promise.resolve(sandbox as never);
        },
        workspaceRoot,
      });

      const session = registry.getSession("chat-1");
      await session.loadSkill(sampleSkills, "grill-with-docs");

      vi.advanceTimersByTime(60 * 60 * 1000);
      await Promise.resolve();

      expect(sandboxes[0]?.stopCount).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reuses a persistent named sandbox by chat id before creating a new one", async () => {
    const resumedSandbox = new FakeSandbox();
    const createdSandbox = new FakeSandbox();
    const getSpy = vi
      .spyOn(Sandbox, "get")
      .mockResolvedValueOnce(resumedSandbox as never)
      .mockRejectedValueOnce(new Error("sandbox not found"));
    const createSpy = vi
      .spyOn(Sandbox, "create")
      .mockResolvedValue(createdSandbox as never);

    await expect(
      createSkillsAgentSandbox("chat-1", {
        VERCEL_OIDC_TOKEN: "oidc-token",
      })
    ).resolves.toBe(resumedSandbox);
    await expect(
      createSkillsAgentSandbox("chat-2", {
        VERCEL_OIDC_TOKEN: "oidc-token",
      })
    ).resolves.toBe(createdSandbox);

    expect(getSpy).toHaveBeenNthCalledWith(1, { name: "chat-1" });
    expect(getSpy).toHaveBeenNthCalledWith(2, { name: "chat-2" });
    expect(resumedSandbox.updateCalls).toEqual([
      {
        keepLastSnapshots: VERCEL_SANDBOX_KEEP_LAST_SNAPSHOTS,
        persistent: true,
        snapshotExpiration: VERCEL_SANDBOX_SNAPSHOT_EXPIRATION_MS,
        tags: {
          app: VERCEL_SANDBOX_DEMO_APP_TAG,
          retention: "7d",
        },
        timeout: 300_000,
      },
    ]);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith({
      keepLastSnapshots: VERCEL_SANDBOX_KEEP_LAST_SNAPSHOTS,
      name: "chat-2",
      persistent: true,
      runtime: "node24",
      snapshotExpiration: VERCEL_SANDBOX_SNAPSHOT_EXPIRATION_MS,
      tags: {
        app: VERCEL_SANDBOX_DEMO_APP_TAG,
        retention: "7d",
      },
      timeout: 300_000,
    });

    getSpy.mockRestore();
    createSpy.mockRestore();
  });
});
