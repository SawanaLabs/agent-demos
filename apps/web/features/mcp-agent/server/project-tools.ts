import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { demoCatalogEntries } from "@/features/demo-catalog/registry";
import type {
  DemoCatalogEntry,
  DemoPattern,
  DemoStatus,
} from "@/features/demo-catalog/types";

export interface ProjectDocFile {
  content: string;
  path: string;
}

export interface DemoDocsBundle {
  files: ProjectDocFile[];
  meta: DemoCatalogEntry;
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

const docsSearchPaths = [
  "docs/index.md",
  "docs/frontend/index.md",
  "docs/frontend/agent-demo-structure.md",
  "docs/frontend/ai-sdk-recipes-checklist.md",
  "docs/frontend/loop-agent.md",
  "docs/frontend/mcp-agent.md",
  "docs/frontend/skills-agent.md",
  "docs/frontend/sandbox-agent.md",
  "docs/frontend/workspace-ui.md",
  "docs/repo/index.md",
  "docs/repo/monorepo.md",
  "docs/quality/index.md",
  "docs/quality/ultracite.md",
] as const;

function findWorkspaceRoot(start = process.cwd()): string {
  let current = start;

  while (current !== path.dirname(current)) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    current = path.dirname(current);
  }

  throw new Error(
    `Unable to locate repository root from ${start}. Expected pnpm-workspace.yaml.`
  );
}

function toRepoPath(absolutePath: string) {
  return path.relative(findWorkspaceRoot(), absolutePath);
}

async function readRepoFile(
  relativePath: string
): Promise<ProjectDocFile | null> {
  const absolutePath = path.join(findWorkspaceRoot(), relativePath);

  if (!existsSync(absolutePath)) {
    return null;
  }

  return {
    content: await readFile(absolutePath, "utf8"),
    path: toRepoPath(absolutePath),
  };
}

export function listDemoCatalogForMcp({
  pattern,
  status,
}: {
  pattern?: DemoPattern;
  status?: DemoStatus;
} = {}) {
  return demoCatalogEntries
    .filter((entry) => (status ? entry.status === status : true))
    .filter((entry) => (pattern ? entry.pattern === pattern : true))
    .map(
      ({
        href,
        pattern: entryPattern,
        slug,
        source,
        status: entryStatus,
        summary,
        title,
      }) => ({
        href,
        pattern: entryPattern,
        slug,
        source,
        status: entryStatus,
        summary,
        title,
      })
    );
}

export async function readDemoDocsForMcp({
  slug,
}: {
  slug: string;
}): Promise<DemoDocsBundle> {
  const meta = demoCatalogEntries.find((entry) => entry.slug === slug);

  if (!meta) {
    throw new Error(`Unknown demo slug: ${slug}`);
  }

  const candidatePaths = [
    `docs/frontend/${slug}.md`,
    `apps/web/features/${slug}/README.md`,
  ];
  const files = (
    await Promise.all(
      candidatePaths.map((candidate) => readRepoFile(candidate))
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

  for (const docsPath of docsSearchPaths) {
    const file = await readRepoFile(docsPath);

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
