import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  findProjectRoot,
  listProjectDocsSearchPaths,
  loadProjectDocsCatalog,
  type ProjectDocsCatalogEntry,
  type ProjectDemoPattern,
  type ProjectDemoStatus,
} from "./project-docs-catalog";

export interface ProjectDocFile {
  content: string;
  path: string;
}

export interface DemoDocsBundle {
  files: ProjectDocFile[];
  meta: ProjectDocsCatalogEntry;
  slug: string;
}

export interface ProjectDocSearchMatch {
  line: number;
  path: string;
  text: string;
}

export const projectMcpToolDefinitions = [
  {
    description:
      "List demo catalog entries, optionally filtered by status or pattern.",
    name: "list_demos",
  },
  {
    description:
      "Read the durable docs bundle for one demo slug, including docs/frontend and feature README when present.",
    name: "read_demo_docs",
  },
  {
    description:
      "Search the project docs system for concise line-level matches.",
    name: "search_project_docs",
  },
] as const;

async function readRepoFile(
  relativePath: string,
  root = findProjectRoot()
): Promise<ProjectDocFile | null> {
  const absolutePath = path.join(root, relativePath);

  if (!existsSync(absolutePath)) {
    return null;
  }

  return {
    content: await readFile(absolutePath, "utf8"),
    path: path.relative(root, absolutePath),
  };
}

export async function listDemoCatalogForMcp({
  pattern,
  status,
}: {
  pattern?: ProjectDemoPattern;
  status?: ProjectDemoStatus;
} = {}) {
  const catalog = await loadProjectDocsCatalog();

  return catalog
    .filter((entry) => (status ? entry.status === status : true))
    .filter((entry) => (pattern ? entry.pattern === pattern : true))
    .map((entry) => ({
      href: entry.status === "ready" ? entry.href : undefined,
      pattern: entry.pattern,
      slug: entry.slug,
      source: entry.source,
      status: entry.status,
      summary: entry.summary,
      title: entry.title,
    }));
}

export async function readDemoDocsForMcp({
  slug,
}: {
  slug: string;
}): Promise<DemoDocsBundle> {
  const root = findProjectRoot();
  const catalog = await loadProjectDocsCatalog(root);
  const meta = catalog.find((entry) => entry.slug === slug);

  if (!meta) {
    throw new Error(`Unknown demo slug: ${slug}`);
  }

  const candidatePaths = [meta.docsPath, meta.readmePath].filter(
    (candidate): candidate is string => Boolean(candidate)
  );
  const files = (
    await Promise.all(
      candidatePaths.map((candidate) => readRepoFile(candidate, root))
    )
  ).filter((file): file is ProjectDocFile => Boolean(file));

  if (files.length === 0) {
    throw new Error(`No durable docs were found for demo slug: ${slug}`);
  }

  return {
    files,
    meta,
    slug,
  };
}

export async function searchProjectDocsForMcp({
  limit = 12,
  query,
}: {
  limit?: number;
  query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    throw new Error("Expected a non-empty docs search query.");
  }

  const matches: ProjectDocSearchMatch[] = [];
  const root = findProjectRoot();
  const docsSearchPaths = await listProjectDocsSearchPaths(root);

  for (const docsPath of docsSearchPaths) {
    const file = await readRepoFile(docsPath, root);

    if (!file) {
      continue;
    }

    file.content.split("\n").forEach((line, index) => {
      if (
        matches.length < limit &&
        line.toLowerCase().includes(normalizedQuery)
      ) {
        matches.push({
          line: index + 1,
          path: file.path,
          text: line.trim(),
        });
      }
    });
  }

  return {
    matches,
    query,
  };
}
