#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import {
  buildWorktreeStackPaths,
  createWorktreeStackId,
  renderSkillEnvShell,
} from "./worktree-stack.mjs";

function main() {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const paths = buildWorktreeStackPaths({
    repoRoot,
    stackId: createWorktreeStackId(repoRoot),
  });

  if (!existsSync(paths.manifestPath)) {
    throw new Error(
      `No observability manifest found at ${paths.manifestPath}. Run pnpm observability:up first.`
    );
  }

  const manifest = JSON.parse(readFileSync(paths.manifestPath, "utf8"));

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(manifest.skillEnv, null, 2)}\n`);
    return;
  }

  process.stdout.write(renderSkillEnvShell(manifest));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
