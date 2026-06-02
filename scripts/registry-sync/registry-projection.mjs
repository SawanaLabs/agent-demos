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

function normalizeRegistryPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function assertRelativeRegistryPath(filePath, field) {
  assertNonEmptyString(filePath, field);

  const normalized = normalizeRegistryPath(filePath);

  if (
    path.isAbsolute(filePath) ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.includes("/../")
  ) {
    throw new Error(`Expected ${field} to stay inside a registry chunk.`);
  }

  return normalized;
}

function normalizeSharedAssetTargetDemos(value, field) {
  if (value === undefined) {
    return null;
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Expected ${field} to be a non-empty string array.`);
  }

  const seen = new Set();

  return value.map((demo, index) => {
    assertNonEmptyString(demo, `${field}[${index}]`);

    if (seen.has(demo)) {
      throw new Error(`Duplicate shared registry asset target demo: ${demo}.`);
    }

    seen.add(demo);

    return demo;
  });
}

function registryManifestPathForDemo({ manifest, repoRoot }) {
  const registryPath =
    manifest.registryPath ??
    path.join("registry", manifest.demo, "registry.json");

  assertNonEmptyString(registryPath, `${manifest.demo}.registryPath`);

  return path.isAbsolute(registryPath)
    ? registryPath
    : path.join(repoRoot, registryPath);
}

function registryChunkPathForManifest({ manifest, repoRoot }) {
  return path.dirname(registryManifestPathForDemo({ manifest, repoRoot }));
}

function registryItemPathForEntry({ entry, manifest, repoRoot }) {
  if (entry.registryItemFile === false) {
    return null;
  }

  assertNonEmptyString(entry.target, `${manifest.demo}.entry.target`);

  const registryChunkPath = registryChunkPathForManifest({
    manifest,
    repoRoot,
  });
  const registryPrefix = `${normalizeRegistryPath(
    path.relative(repoRoot, registryChunkPath)
  )}/`;
  const target = normalizeRegistryPath(entry.target);

  if (!target.startsWith(registryPrefix)) {
    throw new Error(
      [
        `${manifest.demo} projection target must stay inside ${registryPrefix}`,
        entry.target,
      ].join(": ")
    );
  }

  const registryItemPath = target.slice(registryPrefix.length);
  assertNonEmptyString(registryItemPath, `${manifest.demo}.entry.target`);

  return registryItemPath;
}

function readDemoRegistryItem({ manifest, repoRoot }) {
  const registryJsonPath = registryManifestPathForDemo({ manifest, repoRoot });
  const registryJsonDisplayPath = normalizeRegistryPath(
    path.relative(repoRoot, registryJsonPath)
  );

  if (!fs.existsSync(registryJsonPath)) {
    throw new Error(
      `${manifest.demo} projection missing registry item manifest: ${registryJsonDisplayPath}.`
    );
  }

  const registryJson = readJson(registryJsonPath);

  if (!Array.isArray(registryJson.items)) {
    throw new Error(
      `${registryJsonDisplayPath} must define an items array for ${manifest.demo}.`
    );
  }

  const registryItem = registryJson.items.find(
    (item) => item?.name === manifest.demo
  );

  if (!registryItem) {
    throw new Error(
      `${registryJsonDisplayPath} must include an item named ${manifest.demo}.`
    );
  }

  if (!Array.isArray(registryItem.files)) {
    throw new Error(
      `${registryJsonDisplayPath} item ${manifest.demo} must define files[].`
    );
  }

  return { registryItem, registryJsonDisplayPath };
}

function registryItemFilePathSet({ manifest, repoRoot }) {
  const { registryItem, registryJsonDisplayPath } = readDemoRegistryItem({
    manifest,
    repoRoot,
  });
  const filePaths = new Set();

  registryItem.files.forEach((file, index) => {
    assertNonEmptyString(
      file?.path,
      `${registryJsonDisplayPath}.items[${manifest.demo}].files[${index}].path`
    );
    filePaths.add(normalizeRegistryPath(file.path));
  });

  return filePaths;
}

function assertProjectedTargetsListedInRegistryItem({ manifest, repoRoot }) {
  const requiredFilePaths = [];

  for (const entry of manifest.entries) {
    const registryItemPath = registryItemPathForEntry({
      entry,
      manifest,
      repoRoot,
    });

    if (registryItemPath) {
      requiredFilePaths.push({ entry, registryItemPath });
    }
  }

  if (requiredFilePaths.length === 0) {
    return;
  }

  const filePaths = registryItemFilePathSet({ manifest, repoRoot });

  for (const { entry, registryItemPath } of requiredFilePaths) {
    if (!filePaths.has(registryItemPath)) {
      throw new Error(
        [
          `${manifest.demo} projection registry item files[] does not include ${registryItemPath}`,
          `target ${entry.target}`,
          `add ${registryItemPath} to registry/${manifest.demo}/registry.json or set registryItemFile to false`,
        ].join(": ")
      );
    }
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

  if (manifest.registryPath !== undefined) {
    assertNonEmptyString(
      manifest.registryPath,
      `${manifest.demo}.registryPath`
    );
  }

  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error(
      `Expected ${manifestPath} to define at least one projection entry.`
    );
  }

  return manifest;
}

export function readSharedRegistryAssetManifest(manifestPath) {
  const manifest = readJson(manifestPath);
  assertNonEmptyString(manifest.registryDemos, "manifest.registryDemos");

  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error(
      `Expected ${manifestPath} to define at least one shared registry asset.`
    );
  }

  manifest.entries.forEach((entry, index) => {
    assertNonEmptyString(entry.name, `manifest.entries[${index}].name`);
    assertNonEmptyString(entry.source, `${entry.name}.source`);
    entry.demos = normalizeSharedAssetTargetDemos(
      entry.demos,
      `${entry.name}.demos`
    );
    entry.target = assertRelativeRegistryPath(
      entry.target,
      `${entry.name}.target`
    );
  });

  return manifest;
}

function readSharedRegistryAssetDemos({ manifest, repoRoot }) {
  const registryDemosPath = path.join(repoRoot, manifest.registryDemos);

  if (!fs.existsSync(registryDemosPath)) {
    throw new Error(
      `Shared registry asset manifest references missing registry demos file: ${manifest.registryDemos}.`
    );
  }

  const registryDemos = readJson(registryDemosPath);

  if (!Array.isArray(registryDemos.demos) || registryDemos.demos.length === 0) {
    throw new Error(
      `${manifest.registryDemos} must define a non-empty demos array.`
    );
  }

  const seenSlugs = new Set();

  return registryDemos.demos.map((demo, index) => {
    assertNonEmptyString(demo?.slug, `registryDemos.demos[${index}].slug`);
    assertNonEmptyString(
      demo?.registryPath,
      `registryDemos.demos[${demo.slug}].registryPath`
    );

    if (seenSlugs.has(demo.slug)) {
      throw new Error(`Duplicate registry demo slug: ${demo.slug}.`);
    }
    seenSlugs.add(demo.slug);

    return {
      registryPath: demo.registryPath,
      slug: demo.slug,
    };
  });
}

function assertSharedRegistryAssetDemoReferences({ demos, manifest }) {
  const demoSlugs = new Set(demos.map((demo) => demo.slug));

  for (const entry of manifest.entries) {
    for (const demo of entry.demos ?? []) {
      if (!demoSlugs.has(demo)) {
        throw new Error(
          `Shared registry asset ${entry.name} references unknown demo: ${demo}.`
        );
      }
    }
  }
}

function sharedRegistryAssetEntriesForDemo({ demo, manifest }) {
  return manifest.entries.filter(
    (entry) => !entry.demos || entry.demos.includes(demo.slug)
  );
}

function sharedAssetProjectionManifestForDemo({ demo, manifest }) {
  const registryChunkPath = normalizeRegistryPath(
    path.dirname(demo.registryPath)
  );
  const entries = sharedRegistryAssetEntriesForDemo({ demo, manifest });

  return {
    demo: demo.slug,
    entries: entries.map((entry) => ({
      ...entry,
      target: normalizeRegistryPath(path.join(registryChunkPath, entry.target)),
    })),
    registryPath: demo.registryPath,
  };
}

function runSharedRegistryAssetsProjection({ demo, manifest, mode, repoRoot }) {
  const allDemos = readSharedRegistryAssetDemos({ manifest, repoRoot });

  assertSharedRegistryAssetDemoReferences({ demos: allDemos, manifest });

  const demos = allDemos.filter((entry) => !demo || entry.slug === demo);

  if (demos.length === 0) {
    throw new Error(`Shared registry asset target demo not found: ${demo}.`);
  }

  const changed = [];
  const unchanged = [];

  for (const targetDemo of demos) {
    const projectionManifest = sharedAssetProjectionManifestForDemo({
      demo: targetDemo,
      manifest,
    });
    const result =
      mode === "check"
        ? checkRegistryProjection({ manifest: projectionManifest, repoRoot })
        : writeRegistryProjection({ manifest: projectionManifest, repoRoot });

    changed.push(...result.changed);
    unchanged.push(...result.unchanged);
  }

  return { changed, unchanged };
}

export function checkSharedRegistryAssetProjection({
  demo,
  manifest,
  repoRoot,
}) {
  return runSharedRegistryAssetsProjection({
    demo,
    manifest,
    mode: "check",
    repoRoot,
  });
}

export function writeSharedRegistryAssetProjection({
  demo,
  manifest,
  repoRoot,
}) {
  return runSharedRegistryAssetsProjection({
    demo,
    manifest,
    mode: "write",
    repoRoot,
  });
}

export function runSharedRegistryAssetProjection({
  demo,
  manifestPath,
  mode,
  repoRoot,
}) {
  if (!["check", "write"].includes(mode)) {
    throw new Error(
      `Unsupported shared registry asset projection mode: ${mode}.`
    );
  }

  const manifest = readSharedRegistryAssetManifest(manifestPath);
  const result =
    mode === "check"
      ? checkSharedRegistryAssetProjection({ demo, manifest, repoRoot })
      : writeSharedRegistryAssetProjection({ demo, manifest, repoRoot });

  return {
    ...result,
    demo: demo ? `${demo} shared registry assets` : "shared registry assets",
    manifestPath,
    mode,
  };
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

  assertProjectedTargetsListedInRegistryItem({ manifest, repoRoot });

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

  assertProjectedTargetsListedInRegistryItem({ manifest, repoRoot });

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
