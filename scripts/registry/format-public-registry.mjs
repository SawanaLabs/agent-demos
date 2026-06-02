#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const publicOutputDir = path.join(repoRoot, "apps/web/public/r");

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function getPublicRegistryFiles() {
  if (!fs.existsSync(publicOutputDir)) {
    throw new Error(
      `Missing public registry output directory: ${publicOutputDir}`
    );
  }

  return fs
    .readdirSync(publicOutputDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => path.join(publicOutputDir, fileName));
}

function formatPublicRegistryFile(filePath) {
  const current = fs.readFileSync(filePath, "utf8");
  const formatted = stableStringify(JSON.parse(current));

  return {
    changed: current !== formatted,
    formatted,
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const shouldWrite = args.has("--write");
  const shouldCheck = args.has("--check");

  if (shouldWrite === shouldCheck) {
    throw new Error("Choose exactly one of --check or --write.");
  }

  const changedFiles = [];

  for (const filePath of getPublicRegistryFiles()) {
    const result = formatPublicRegistryFile(filePath);

    if (!result.changed) {
      continue;
    }

    changedFiles.push(path.relative(repoRoot, filePath));

    if (shouldWrite) {
      fs.writeFileSync(filePath, result.formatted);
    }
  }

  if (changedFiles.length === 0) {
    console.log("Public registry JSON formatting is clean.");
    return;
  }

  if (shouldCheck) {
    throw new Error(
      `Public registry JSON formatting is stale: ${changedFiles.join(", ")}.`
    );
  }

  console.log(`Formatted public registry JSON: ${changedFiles.join(", ")}`);
}

main();
