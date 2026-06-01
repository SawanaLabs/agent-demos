import fs from "node:fs";
import path from "node:path";

export function countMatches(text, needle) {
  if (!needle) {
    return 0;
  }

  return text.split(needle).length - 1;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${field} to be a non-empty string.`);
  }
}

export function resolveProjectionManifests({
  demo,
  manifestPath,
  repoRoot,
  syncRoot = path.join(repoRoot, "scripts/registry-sync"),
}) {
  const selectedInputs = [Boolean(demo), Boolean(manifestPath)].filter(Boolean);

  if (selectedInputs.length > 1) {
    throw new Error("Choose either --demo or --manifest, not both.");
  }

  if (manifestPath) {
    return [path.resolve(repoRoot, manifestPath)];
  }

  if (demo) {
    return [path.join(syncRoot, `${demo}.manifest.json`)];
  }

  return fs
    .readdirSync(syncRoot)
    .filter((fileName) => fileName.endsWith(".manifest.json"))
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => path.join(syncRoot, fileName));
}

export function readProjectionManifest(manifestPath) {
  const manifest = readJson(manifestPath);
  assertNonEmptyString(manifest.demo, "manifest.demo");

  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error(
      `Expected ${manifestPath} to define at least one projection entry.`
    );
  }

  return manifest;
}

function applyTransforms({ entry, manifest, source }) {
  let transformed = source;

  for (const transform of entry.transforms ?? []) {
    assertNonEmptyString(transform.from, `${entry.source}.transform.from`);

    if (typeof transform.to !== "string") {
      throw new Error(`Expected ${entry.source}.transform.to to be a string.`);
    }

    const matches = countMatches(transformed, transform.from);
    const expectedMatches = transform.expectedMatches ?? 1;

    if (matches !== expectedMatches) {
      throw new Error(
        [
          `${manifest.demo} projection failed for ${entry.source}`,
          `expected ${expectedMatches} match(es) of ${JSON.stringify(transform.from)}`,
          `but found ${matches}`,
        ].join(": ")
      );
    }

    transformed = transformed.split(transform.from).join(transform.to);
  }

  return transformed;
}

function assertForbiddenPatternsAbsent({ entry, manifest, transformed }) {
  for (const forbiddenPattern of entry.forbidPatternsAfterTransform ?? []) {
    if (transformed.includes(forbiddenPattern)) {
      throw new Error(
        `${manifest.demo} projection left forbidden pattern ${JSON.stringify(
          forbiddenPattern
        )} in ${entry.source}.`
      );
    }
  }
}

export function projectRegistryEntry({
  allowMissingTarget = false,
  entry,
  manifest,
  repoRoot,
}) {
  assertNonEmptyString(entry.source, `${manifest.demo}.entry.source`);
  assertNonEmptyString(entry.target, `${manifest.demo}.entry.target`);

  const sourcePath = path.join(repoRoot, entry.source);
  const targetPath = path.join(repoRoot, entry.target);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `${manifest.demo} projection missing source file: ${entry.source}.`
    );
  }

  if (!(fs.existsSync(targetPath) || allowMissingTarget)) {
    throw new Error(
      `${manifest.demo} projection missing target file: ${entry.target}.`
    );
  }

  const source = fs.readFileSync(sourcePath, "utf8");
  const target = fs.existsSync(targetPath)
    ? fs.readFileSync(targetPath, "utf8")
    : "";
  const transformed = applyTransforms({ entry, manifest, source });

  assertForbiddenPatternsAbsent({ entry, manifest, transformed });

  return {
    changed: transformed !== target,
    target,
    targetPath,
    transformed,
  };
}

export function checkRegistryProjection({ manifest, repoRoot }) {
  const changed = [];
  const unchanged = [];

  for (const entry of manifest.entries) {
    const projection = projectRegistryEntry({ entry, manifest, repoRoot });

    if (projection.changed) {
      changed.push(entry.target);
    } else {
      unchanged.push(entry.target);
    }
  }

  return { changed, unchanged };
}

export function writeRegistryProjection({ manifest, repoRoot }) {
  const changed = [];
  const unchanged = [];

  for (const entry of manifest.entries) {
    const projection = projectRegistryEntry({
      allowMissingTarget: true,
      entry,
      manifest,
      repoRoot,
    });

    if (!projection.changed) {
      unchanged.push(entry.target);
      continue;
    }

    fs.mkdirSync(path.dirname(projection.targetPath), { recursive: true });
    fs.writeFileSync(projection.targetPath, projection.transformed);
    changed.push(entry.target);
  }

  return { changed, unchanged };
}

export function runRegistryProjection({ manifestPath, mode, repoRoot }) {
  if (!["check", "write"].includes(mode)) {
    throw new Error(`Unsupported registry projection mode: ${mode}.`);
  }

  const manifest = readProjectionManifest(manifestPath);
  const result =
    mode === "check"
      ? checkRegistryProjection({ manifest, repoRoot })
      : writeRegistryProjection({ manifest, repoRoot });

  return {
    ...result,
    demo: manifest.demo,
    manifestPath,
    mode,
  };
}
