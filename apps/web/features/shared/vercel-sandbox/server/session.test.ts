import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createVercelSandboxSessionRegistry,
  VERCEL_SANDBOX_AGENTS_FILE,
  VERCEL_SANDBOX_PROJECT_ROOT,
  type VercelSandboxFactory,
} from "./session";

class FakeSandboxFileSystem {
  readonly directories = new Set<string>();
  readonly files = new Map<string, string>();

  exists(targetPath: string) {
    return Promise.resolve(
      this.directories.has(targetPath) || this.files.has(targetPath)
    );
  }

  mkdir(targetPath: string, options?: { recursive?: boolean }) {
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
    this.files.set(
      targetPath,
      typeof content === "string"
        ? content
        : Buffer.from(content).toString("utf-8")
    );

    return Promise.resolve();
  }
}

class FakeSandbox {
  readonly fs = new FakeSandboxFileSystem();
  stopCount = 0;

  runCommand() {
    return Promise.resolve({
      exitCode: 0,
      stderr: async () => "",
      stdout: async () => "ok",
    });
  }

  stop() {
    this.stopCount += 1;
    return Promise.resolve();
  }
}

const temporaryDirectories: string[] = [];

async function createWorkspaceFixture() {
  const workspaceRoot = await mkdtemp(
    path.join(os.tmpdir(), "vercel-sandbox-session-")
  );
  temporaryDirectories.push(workspaceRoot);
  await writeFile(path.join(workspaceRoot, "AGENTS.md"), "# Agents\n");

  return workspaceRoot;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe("vercel sandbox session registry", () => {
  it("runs a demo-specific bootstrap adapter once after seeding the base workspace", async () => {
    const workspaceRoot = await createWorkspaceFixture();
    const sandboxes: FakeSandbox[] = [];
    const bootstrapCalls: string[] = [];
    const createSandbox: VercelSandboxFactory = async () => {
      const sandbox = new FakeSandbox();
      sandboxes.push(sandbox);
      return sandbox;
    };
    const registry = createVercelSandboxSessionRegistry({
      bootstrapSandbox: async ({ sandbox, sessionId }) => {
        bootstrapCalls.push(sessionId);
        expect(
          await sandbox.fs.readFile(VERCEL_SANDBOX_AGENTS_FILE, "utf-8")
        ).toContain("# Agents");
      },
      createSandbox,
      workspaceRoot,
    });

    const firstSession = registry.getSession("chat-1");
    const secondSession = registry.getSession("chat-1");

    await expect(firstSession.readFile("AGENTS.md")).resolves.toContain(
      "# Agents"
    );
    await expect(
      secondSession.writeFile("artifacts/demo.txt", "hello")
    ).resolves.toMatchObject({
      path: `${VERCEL_SANDBOX_PROJECT_ROOT}/artifacts/demo.txt`,
    });

    expect(bootstrapCalls).toEqual(["chat-1"]);
    expect(sandboxes).toHaveLength(1);
  });
});
