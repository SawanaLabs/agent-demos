#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveProjectionManifests,
  runRegistryProjection,
} from "./registry-projection.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

function usage() {
  console.log(`Usage:
  node scripts/registry-sync/sync-registry-demo.mjs --all --check
  node scripts/registry-sync/sync-registry-demo.mjs --all --write
  node scripts/registry-sync/sync-registry-demo.mjs --demo foundation-chat --check
  node scripts/registry-sync/sync-registry-demo.mjs --manifest scripts/registry-sync/foundation-chat.manifest.json --write

Options:
  --all       Run every scripts/registry-sync/*.manifest.json projection.
  --demo      Run one projection manifest by demo slug.
  --manifest  Run one projection manifest by path.
  --check     Fail if projected registry source has drifted.
  --write     Write projected registry source.
  --build     After --write, run pnpm registry:build.`);
}

function parseArgs(argv) {
  const parsed = {
    all: false,
    build: false,
    check: false,
    demo: null,
    manifestPath: null,
    write: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--all":
        parsed.all = true;
        break;
      case "--build":
        parsed.build = true;
        break;
      case "--check":
        parsed.check = true;
        break;
      case "--demo":
        parsed.demo = argv[index + 1] ?? null;
        index += 1;
        break;
      case "--manifest":
        parsed.manifestPath = argv[index + 1] ?? null;
        index += 1;
        break;
      case "--write":
        parsed.write = true;
        break;
      case "--help":
        usage();
        process.exit(0);
        break;
      case "-h":
        usage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}.`);
    }
  }

  if (parsed.check === parsed.write) {
    throw new Error("Choose exactly one of --check or --write.");
  }

  const selectedTargets = [
    parsed.all,
    Boolean(parsed.demo),
    Boolean(parsed.manifestPath),
  ].filter(Boolean);

  if (selectedTargets.length !== 1) {
    throw new Error("Choose exactly one target: --all, --demo, or --manifest.");
  }

  if (parsed.build && !parsed.write) {
    throw new Error("--build can only be used with --write.");
  }

  return parsed;
}

function printResult(result) {
  if (result.changed.length === 0) {
    console.log(`${result.demo} projection ${result.mode} clean`);
  } else if (result.mode === "check") {
    console.error(`${result.demo} projection drift detected:`);
  } else {
    console.log(`${result.demo} projection wrote:`);
  }

  for (const file of result.changed) {
    const prefix = result.mode === "write" ? "synced" : "drift";
    console[result.mode === "write" ? "log" : "error"](`  ${prefix} ${file}`);
  }

  for (const file of result.unchanged) {
    console.log(`  clean ${file}`);
  }
}

function runBuild() {
  const result = spawnSync("pnpm", ["registry:build"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    usage();
    process.exit(1);
  }

  const manifestPaths = args.all
    ? resolveProjectionManifests({ repoRoot })
    : resolveProjectionManifests({
        demo: args.demo,
        manifestPath: args.manifestPath,
        repoRoot,
      });
  const mode = args.write ? "write" : "check";
  let hasDrift = false;

  for (const manifestPath of manifestPaths) {
    const result = runRegistryProjection({
      manifestPath,
      mode,
      repoRoot,
    });

    printResult(result);
    hasDrift ||= result.mode === "check" && result.changed.length > 0;
  }

  if (hasDrift) {
    process.exit(1);
  }

  if (args.build) {
    runBuild();
  }
}

main();
