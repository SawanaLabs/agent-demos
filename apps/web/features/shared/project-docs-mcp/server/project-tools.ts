import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  findProjectRoot,
  listProjectDocsSearchPaths,
  loadProjectDocsCatalog,
  type ProjectDemoPattern,
  type ProjectDemoStatus,
  type ProjectDocsCatalogEntry,
} from "./project-docs-catalog";
import { listProjectSourceSearchPaths } from "./project-source-catalog";

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

interface ScoredProjectDocSearchMatch extends ProjectDocSearchMatch {
  order: number;
  score: number;
}

export interface ProjectSourceSearchMatch {
  line: number;
  path: string;
  text: string;
}

interface ScoredProjectSourceSearchMatch extends ProjectSourceSearchMatch {
  order: number;
  score: number;
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
  {
    description:
      "Search allowlisted project source files in apps/web/features, apps/web/app, packages, and apps/langgraph-agent-api.",
    name: "search_project_sources",
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

const tokenPattern = /[\p{L}\p{N}][\p{L}\p{N}._/-]*/gu;
const cjkPhrasePattern = /[\p{Script=Han}]{2,}/gu;
const tokenSeparatorPattern = /[._/-]+/g;
const searchStopWords = new Set([
  "and",
  "based",
  "between",
  "core",
  "docs",
  "for",
  "from",
  "the",
  "with",
]);

function normalizeSearchText(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

function pushSearchToken(tokens: Set<string>, token: string) {
  const normalizedToken = token.trim();

  if (
    normalizedToken.length < 2 ||
    searchStopWords.has(normalizedToken) ||
    tokens.size >= 32
  ) {
    return;
  }

  tokens.add(normalizedToken);
}

function getSearchTokens(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = new Set<string>();

  for (const match of normalizedQuery.matchAll(tokenPattern)) {
    for (const segment of match[0].split(tokenSeparatorPattern)) {
      pushSearchToken(tokens, segment);
    }
  }

  for (const match of normalizedQuery.matchAll(cjkPhrasePattern)) {
    const phrase = match[0];

    for (let index = 0; index < phrase.length - 1; index += 1) {
      pushSearchToken(tokens, phrase.slice(index, index + 2));
    }
  }

  return [...tokens];
}

function scoreSearchLine(input: {
  line: string;
  normalizedQuery: string;
  path: string;
  tokens: string[];
}) {
  const normalizedLine = normalizeSearchText(input.line);
  const normalizedPath = normalizeSearchText(input.path);
  const haystack = `${normalizedPath} ${normalizedLine}`;
  let score = haystack.includes(input.normalizedQuery) ? 1000 : 0;

  for (const token of input.tokens) {
    if (normalizedLine.includes(token)) {
      score += token.length >= 6 ? 10 : 5;
    }

    if (normalizedPath.includes(token)) {
      score += token.length >= 6 ? 6 : 3;
    }
  }

  if (score === 0) {
    return 0;
  }

  if (input.line.trimStart().startsWith("#")) {
    score += 4;
  }

  return score;
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
  const normalizedQuery = normalizeSearchText(query.trim());

  if (!normalizedQuery) {
    throw new Error("Expected a non-empty docs search query.");
  }

  const tokens = getSearchTokens(query);
  const matches: ScoredProjectDocSearchMatch[] = [];
  const root = findProjectRoot();
  const docsSearchPaths = await listProjectDocsSearchPaths(root);
  let order = 0;

  for (const docsPath of docsSearchPaths) {
    const file = await readRepoFile(docsPath, root);

    if (!file) {
      continue;
    }

    file.content.split("\n").forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return;
      }

      const score = scoreSearchLine({
        line: trimmedLine,
        normalizedQuery,
        path: file.path,
        tokens,
      });

      if (score > 0) {
        matches.push({
          line: index + 1,
          order,
          path: file.path,
          score,
          text: line.trim(),
        });
        order += 1;
      }
    });
  }

  return {
    matches: matches
      .sort(
        (left, right) => right.score - left.score || left.order - right.order
      )
      .slice(0, limit)
      .map(({ line, path: matchPath, text }) => ({
        line,
        path: matchPath,
        text,
      })),
    query,
  };
}

export async function searchProjectSourcesForMcp({
  limit = 12,
  query,
}: {
  limit?: number;
  query: string;
}) {
  const normalizedQuery = normalizeSearchText(query.trim());

  if (!normalizedQuery) {
    throw new Error("Expected a non-empty source search query.");
  }

  const tokens = getSearchTokens(query);
  const matches: ScoredProjectSourceSearchMatch[] = [];
  const root = findProjectRoot();
  const sourceSearchPaths = await listProjectSourceSearchPaths(root);
  let order = 0;

  for (const sourcePath of sourceSearchPaths) {
    const file = await readRepoFile(sourcePath, root);

    if (!file) {
      continue;
    }

    file.content.split("\n").forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return;
      }

      const score = scoreSearchLine({
        line: trimmedLine,
        normalizedQuery,
        path: file.path,
        tokens,
      });

      if (score > 0) {
        matches.push({
          line: index + 1,
          order,
          path: file.path,
          score,
          text: trimmedLine,
        });
        order += 1;
      }
    });
  }

  return {
    matches: matches
      .sort(
        (left, right) => right.score - left.score || left.order - right.order
      )
      .slice(0, limit)
      .map(({ line, path: matchPath, text }) => ({
        line,
        path: matchPath,
        text,
      })),
    query,
  };
}
