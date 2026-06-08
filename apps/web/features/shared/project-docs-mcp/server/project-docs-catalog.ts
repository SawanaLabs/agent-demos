import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const projectDemoPatterns = [
  "foundation",
  "rag",
  "loop",
  "tools",
  "skills",
  "sandbox",
  "multimodal",
  "structured-output",
  "mcp",
  "generative-ui",
] as const;

export type ProjectDemoPattern = (typeof projectDemoPatterns)[number];

export const projectDemoStatuses = ["ready", "roadmap"] as const;

export type ProjectDemoStatus = (typeof projectDemoStatuses)[number];

export interface ProjectDocsCatalogEntry {
  docsPath: string;
  href: `/demos/${string}`;
  pattern: ProjectDemoPattern;
  readmePath?: string;
  slug: string;
  source: string;
  status: ProjectDemoStatus;
  summary: string;
  title: string;
}

const excludedFrontendDocSlugs = new Set([
  "DOCS",
  "index",
  "agent-demo-structure",
  "ai-sdk-recipes-checklist",
  "homepage-gallery",
  "project-guide-companion",
  "registry-sync",
  "shadcn-registry-distribution",
  "ultra-chatbot-agent-source-checklist",
  "workspace-ui",
]);
const roadmapSlugs = new Set(["openai-agents-sdk-demo", "ultra-chatbot-agent"]);
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const headingPattern = /^#\s+(.+)$/m;
const frontmatterDescriptionPattern = /^description:\s*(.+)$/m;
const frontmatterTitlePattern = /^title:\s*(.+)$/m;

function toRepoPath(root: string, absolutePath: string) {
  return path.relative(root, absolutePath);
}

function stripFrontmatter(content: string) {
  const match = content.match(frontmatterPattern);

  return match ? content.slice(match[0].length).trim() : content.trim();
}

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function inferPattern(slug: string): ProjectDemoPattern {
  if (slug.includes("mcp")) {
    return "mcp";
  }

  if (slug.includes("skills")) {
    return "skills";
  }

  if (slug.includes("sandbox")) {
    return "sandbox";
  }

  if (slug.includes("loop")) {
    return "loop";
  }

  if (slug.includes("rag")) {
    return "rag";
  }

  if (slug.includes("multimodal")) {
    return "multimodal";
  }

  if (slug.includes("generation")) {
    return "structured-output";
  }

  return "tools";
}

function inferStatus(slug: string): ProjectDemoStatus {
  return roadmapSlugs.has(slug) ? "roadmap" : "ready";
}

function firstParagraph(body: string) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find(
      (line) =>
        !(
          line.startsWith("#") ||
          line.startsWith("- ") ||
          line.startsWith("* ")
        )
    );
}

export function findProjectRoot(start = process.cwd()) {
  let current = start;
  let packageRoot: string | null = null;

  while (current !== path.dirname(current)) {
    if (!packageRoot && existsSync(path.join(current, "package.json"))) {
      packageRoot = current;
    }

    if (
      existsSync(path.join(current, "AGENTS.md")) ||
      existsSync(path.join(current, "pnpm-workspace.yaml")) ||
      existsSync(path.join(current, "docs"))
    ) {
      return current;
    }

    current = path.dirname(current);
  }

  return packageRoot ?? start;
}

async function readDocsMetadata(absolutePath: string, slug: string) {
  const content = await readFile(absolutePath, "utf8");
  const frontmatter = content.match(frontmatterPattern)?.[1] ?? "";
  const body = stripFrontmatter(content);

  return {
    summary:
      frontmatter.match(frontmatterDescriptionPattern)?.[1]?.trim() ??
      firstParagraph(body) ??
      `${humanizeSlug(slug)} project docs.`,
    title:
      frontmatter.match(frontmatterTitlePattern)?.[1]?.trim() ??
      body.match(headingPattern)?.[1]?.trim() ??
      humanizeSlug(slug),
  };
}

export async function loadProjectDocsCatalog(
  root = findProjectRoot()
): Promise<ProjectDocsCatalogEntry[]> {
  const docsDirectory = path.join(root, "docs/frontend");

  if (!existsSync(docsDirectory)) {
    return [];
  }

  const entries = await readdir(docsDirectory);
  const catalog: ProjectDocsCatalogEntry[] = [];

  for (const entry of entries.sort()) {
    if (!entry.endsWith(".md")) {
      continue;
    }

    const slug = entry.slice(0, -3);

    if (excludedFrontendDocSlugs.has(slug)) {
      continue;
    }

    const absoluteDocsPath = path.join(docsDirectory, entry);
    const metadata = await readDocsMetadata(absoluteDocsPath, slug);
    const absoluteReadmePath = path.join(
      root,
      "apps/web/features",
      slug,
      "README.md"
    );

    catalog.push({
      docsPath: toRepoPath(root, absoluteDocsPath),
      href: `/demos/${slug}`,
      pattern: inferPattern(slug),
      readmePath: existsSync(absoluteReadmePath)
        ? toRepoPath(root, absoluteReadmePath)
        : undefined,
      slug,
      source: "docs/frontend",
      status: inferStatus(slug),
      summary: metadata.summary,
      title: metadata.title,
    });
  }

  return catalog.sort((left, right) => left.title.localeCompare(right.title));
}

async function collectMarkdownPaths(root: string, directory: string) {
  const absoluteDirectory = path.join(root, directory);

  if (!existsSync(absoluteDirectory)) {
    return [];
  }

  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownPaths(root, relativePath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

export async function listProjectDocsSearchPaths(root = findProjectRoot()) {
  const paths = new Set(await collectMarkdownPaths(root, "docs"));
  const catalog = await loadProjectDocsCatalog(root);

  for (const entry of catalog) {
    if (entry.readmePath) {
      paths.add(entry.readmePath);
    }
  }

  return Array.from(paths).sort();
}
