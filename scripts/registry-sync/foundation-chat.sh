#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/registry-sync/foundation-chat.sh --check
  scripts/registry-sync/foundation-chat.sh --write

Modes:
  --check  Validate the manifest transforms and fail on drift without writing.
  --write  Sync registry source files from app-first files, then run pnpm registry:build.
EOF
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

mode="$1"
case "$mode" in
  --check|--write) ;;
  *)
    usage
    exit 1
    ;;
esac

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/../.." && pwd)"
manifest_path="$script_dir/foundation-chat.manifest.json"

node - "$mode" "$repo_root" "$manifest_path" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [mode, repoRoot, manifestPath] = process.argv.slice(2);

function countMatches(text, needle) {
  if (!needle) {
    return 0;
  }

  return text.split(needle).length - 1;
}

function fail(message) {
  console.error(`foundation-chat sync failed: ${message}`);
  process.exit(1);
}

if (!["--check", "--write"].includes(mode)) {
  fail(`unsupported mode "${mode}"`);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const changedFiles = [];
const unchangedFiles = [];

for (const entry of manifest.entries) {
  const sourcePath = path.join(repoRoot, entry.source);
  const targetPath = path.join(repoRoot, entry.target);

  if (!fs.existsSync(sourcePath)) {
    fail(`missing source file: ${entry.source}`);
  }

  if (!fs.existsSync(targetPath)) {
    fail(`missing target file: ${entry.target}`);
  }

  const source = fs.readFileSync(sourcePath, "utf8");
  const target = fs.readFileSync(targetPath, "utf8");
  let transformed = source;

  for (const transform of entry.transforms ?? []) {
    const matches = countMatches(transformed, transform.from);
    const expectedMatches = transform.expectedMatches ?? 1;

    if (matches !== expectedMatches) {
      fail(
        [
          `transform mismatch for ${entry.source}`,
          `expected ${expectedMatches} match(es) of ${JSON.stringify(transform.from)}`,
          `but found ${matches}`,
        ].join(": ")
      );
    }

    transformed = transformed.split(transform.from).join(transform.to);
  }

  for (const forbiddenPattern of entry.forbidPatternsAfterTransform ?? []) {
    if (transformed.includes(forbiddenPattern)) {
      fail(
        `forbidden pattern ${JSON.stringify(forbiddenPattern)} remained in transformed output for ${entry.source}`
      );
    }
  }

  if (transformed === target) {
    unchangedFiles.push(entry.target);
    continue;
  }

  changedFiles.push(entry.target);

  if (mode === "--write") {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, transformed);
  }
}

if (changedFiles.length === 0) {
  console.log(`foundation-chat sync ${mode} clean`);
  for (const file of unchangedFiles) {
    console.log(`  clean ${file}`);
  }
  process.exit(0);
}

if (mode === "--check") {
  console.error("foundation-chat sync drift detected:");
  for (const file of changedFiles) {
    console.error(`  drift ${file}`);
  }
  process.exit(1);
}

console.log("foundation-chat sync wrote:");
for (const file of changedFiles) {
  console.log(`  synced ${file}`);
}
for (const file of unchangedFiles) {
  console.log(`  clean ${file}`);
}
NODE

if [[ "$mode" == "--write" ]]; then
  cd "$repo_root"
  pnpm registry:build
fi
