import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { findProjectRoot } from "./project-docs-catalog";

export const projectSourceSearchRootPaths = [
  "apps/web/features",
  "apps/web/app",
  "packages",
  "apps/langgraph-agent-api",
] as const;

const searchableSourceExtensions = new Set([
  ".cjs",
  ".css",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".py",
  ".sh",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const ignoredDirectoryNames = new Set([
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);
const ignoredFileNames = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "uv.lock",
  "yarn.lock",
]);
const ignoredRelativePathPrefixes = ["packages/database/drizzle/meta/"];
const maxProjectSourceFileBytes = 256 * 1024;

function toRepositoryPath(value: string) {
  return value.split(path.sep).join("/");
}

function isInsideProjectSourceRoot(relativePath: string) {
  return projectSourceSearchRootPaths.some(
    (rootPath) =>
      relativePath === rootPath || relativePath.startsWith(`${rootPath}/`)
  );
}

function hasIgnoredPathSegment(relativePath: string) {
  return relativePath.split("/").some((segment) => {
    if (!segment) {
      return false;
    }

    return (
      segment.startsWith(".") ||
      segment.startsWith(".env") ||
      ignoredDirectoryNames.has(segment)
    );
  });
}

function shouldSearchSourcePath(relativePath: string) {
  if (
    !isInsideProjectSourceRoot(relativePath) ||
    hasIgnoredPathSegment(relativePath) ||
    ignoredRelativePathPrefixes.some((prefix) =>
      relativePath.startsWith(prefix)
    ) ||
    ignoredFileNames.has(path.basename(relativePath))
  ) {
    return false;
  }

  return searchableSourceExtensions.has(path.extname(relativePath));
}

function shouldSkipDirectory(name: string) {
  return name.startsWith(".") || ignoredDirectoryNames.has(name);
}

async function collectSourceSearchPaths(input: {
  absoluteDirectory: string;
  relativeDirectory: string;
  searchPaths: string[];
}) {
  const entries = await readDirectoryEntries(input.absoluteDirectory);

  if (!entries) {
    return;
  }

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name)
  )) {
    const relativePath = toRepositoryPath(
      path.join(input.relativeDirectory, entry.name)
    );
    const absolutePath = path.join(input.absoluteDirectory, entry.name);

    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) {
        await collectSourceSearchPaths({
          absoluteDirectory: absolutePath,
          relativeDirectory: relativePath,
          searchPaths: input.searchPaths,
        });
      }

      continue;
    }

    if (
      !(entry.isFile() && shouldSearchSourcePath(relativePath)) ||
      (await stat(absolutePath)).size > maxProjectSourceFileBytes
    ) {
      continue;
    }

    input.searchPaths.push(relativePath);
  }
}

async function readDirectoryEntries(directory: string) {
  try {
    return await readdir(directory, {
      withFileTypes: true,
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function listProjectSourceSearchPaths(
  root = findProjectRoot()
): Promise<string[]> {
  const searchPaths: string[] = [];

  for (const sourceRootPath of projectSourceSearchRootPaths) {
    await collectSourceSearchPaths({
      absoluteDirectory: path.join(root, sourceRootPath),
      relativeDirectory: sourceRootPath,
      searchPaths,
    });
  }

  return searchPaths;
}
