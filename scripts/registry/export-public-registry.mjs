import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const manifestPath = path.join(repoRoot, "registry/registry-demos.json");
const rootRegistryPath = path.join(repoRoot, "registry.json");
const publicOutputDir = path.join(repoRoot, "apps/web/public/r");
const schema = "https://ui.shadcn.com/schema/registry.json";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${field} to be a non-empty string.`);
  }
}

function validateManifest(manifest) {
  assertString(manifest.name, "manifest.name");
  assertString(manifest.homepage, "manifest.homepage");
  assertString(manifest.namespace, "manifest.namespace");
  assertString(manifest.productionDomain, "manifest.productionDomain");

  if (!Array.isArray(manifest.demos) || manifest.demos.length === 0) {
    throw new Error("Expected manifest.demos to contain registry entries.");
  }

  const seenSlugs = new Set();
  const publishedDemos = [];
  const mainlineDemos = [];

  for (const demo of manifest.demos) {
    assertString(demo.slug, "demo.slug");
    assertString(demo.title, `${demo.slug}.title`);
    assertString(demo.registryPath, `${demo.slug}.registryPath`);
    assertString(demo.setup, `${demo.slug}.setup`);

    if (seenSlugs.has(demo.slug)) {
      throw new Error(`Duplicate registry demo slug: ${demo.slug}.`);
    }
    seenSlugs.add(demo.slug);

    const demoRegistryPath = path.join(repoRoot, demo.registryPath);
    if (!fs.existsSync(demoRegistryPath)) {
      throw new Error(
        `Missing registry file for ${demo.slug}: ${demo.registryPath}.`
      );
    }

    const demoRegistry = readJson(demoRegistryPath);
    const itemNames = (demoRegistry.items ?? []).map((item) => item.name);
    if (!itemNames.includes(demo.slug)) {
      throw new Error(
        `Registry file ${demo.registryPath} does not export item ${demo.slug}.`
      );
    }

    if (demo.publicRegistry) {
      publishedDemos.push(demo);
    }

    if (demo.mainline) {
      mainlineDemos.push(demo);
    }
  }

  if (publishedDemos.length === 0) {
    throw new Error("At least one demo must be publicRegistry: true.");
  }

  if (mainlineDemos.length !== 1 || !mainlineDemos[0].publicRegistry) {
    throw new Error(
      "Expected exactly one public mainline registry demo for the guide."
    );
  }

  return publishedDemos;
}

function buildRootRegistry(manifest, publishedDemos) {
  return {
    $schema: schema,
    name: manifest.name,
    homepage: manifest.homepage,
    include: publishedDemos.map((demo) => demo.registryPath),
  };
}

function checkRootRegistry(expectedRootRegistry) {
  if (!fs.existsSync(rootRegistryPath)) {
    throw new Error(
      "registry.json does not exist. Run pnpm registry:generate."
    );
  }

  const current = fs.readFileSync(rootRegistryPath, "utf8");
  const expected = stableStringify(expectedRootRegistry);

  if (current !== expected) {
    throw new Error(
      "registry.json is stale. Run pnpm registry:generate before validating."
    );
  }
}

function writeRootRegistry(expectedRootRegistry) {
  fs.writeFileSync(rootRegistryPath, stableStringify(expectedRootRegistry));
}

function cleanPublicOutput(publishedDemos) {
  if (!fs.existsSync(publicOutputDir)) {
    return;
  }

  const expectedFiles = new Set([
    "registry.json",
    ...publishedDemos.map((demo) => `${demo.slug}.json`),
  ]);
  const staleFiles = fs
    .readdirSync(publicOutputDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .filter((fileName) => !expectedFiles.has(fileName));

  for (const fileName of staleFiles) {
    fs.unlinkSync(path.join(publicOutputDir, fileName));
  }

  if (staleFiles.length > 0) {
    console.log(
      `Removed stale public registry output: ${staleFiles.join(", ")}`
    );
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  const shouldWrite = args.has("--write");
  const shouldCheck = args.has("--check");
  const shouldCleanOutput = args.has("--clean-output");

  if (!(shouldWrite || shouldCheck || shouldCleanOutput)) {
    throw new Error(
      "Expected --write, --check, or --clean-output. Refusing to guess."
    );
  }

  const manifest = readJson(manifestPath);
  const publishedDemos = validateManifest(manifest);
  const expectedRootRegistry = buildRootRegistry(manifest, publishedDemos);

  if (shouldWrite) {
    writeRootRegistry(expectedRootRegistry);
    console.log(
      `Generated registry.json with ${publishedDemos.length} public demos.`
    );
  }

  if (shouldCheck) {
    checkRootRegistry(expectedRootRegistry);
    console.log(
      `registry.json is aligned with ${publishedDemos.length} public demos.`
    );
  }

  if (shouldCleanOutput) {
    cleanPublicOutput(publishedDemos);
  }
}

main();
