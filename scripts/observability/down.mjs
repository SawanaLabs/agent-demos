#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";

import {
  buildWorktreeStackPaths,
  createWorktreeStackId,
} from "./worktree-stack.mjs";

async function main() {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const paths = buildWorktreeStackPaths({
    repoRoot,
    stackId: createWorktreeStackId(repoRoot),
  });

  if (!existsSync(paths.manifestPath)) {
    console.log(
      "No development observability stack is running for this worktree."
    );
    return;
  }

  const manifest = JSON.parse(readFileSync(paths.manifestPath, "utf8"));
  const pid = manifest.victoriaMetrics.pid;

  if (Number.isInteger(pid) && isProcessRunning(pid)) {
    process.kill(pid, "SIGTERM");
    await waitForExit(pid, 3000);
  }

  if (Number.isInteger(pid) && isProcessRunning(pid)) {
    process.kill(pid, "SIGKILL");
  }

  rmSync(paths.stackRoot, { force: true, recursive: true });
  rmSync(paths.currentPath, { force: true });
  console.log("Development observability stack stopped and removed.");
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (!isProcessRunning(pid)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
