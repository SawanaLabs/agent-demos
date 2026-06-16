import { createHash } from "node:crypto";
import path from "node:path";

export const DEFAULT_METRICS_PATH = "/api/dev/observability/metrics";
export const DEFAULT_SCRAPE_INTERVAL = "2s";

export function createWorktreeStackId(repoRoot) {
  if (!repoRoot) {
    throw new Error(
      "repoRoot is required to create an observability stack id."
    );
  }

  return `worktree-${createHash("sha256")
    .update(path.resolve(repoRoot))
    .digest("hex")
    .slice(0, 12)}`;
}

export function buildVictoriaMetricsManifest({
  binary,
  createdAt = new Date().toISOString(),
  metricsPath = DEFAULT_METRICS_PATH,
  metricsPort,
  pid,
  repoRoot,
  stackId = createWorktreeStackId(repoRoot),
  storagePath,
  target,
}) {
  if (!Number.isInteger(metricsPort)) {
    throw new Error("metricsPort must be an integer.");
  }

  if (!Number.isInteger(pid)) {
    throw new Error("pid must be an integer.");
  }

  if (!repoRoot) {
    throw new Error("repoRoot is required.");
  }

  if (!target) {
    throw new Error("target is required.");
  }

  const url = `http://127.0.0.1:${metricsPort}`;

  return {
    createdAt,
    repoRoot: path.resolve(repoRoot),
    runner: "binary",
    skillEnv: {
      VM_AUTH_HEADER: "",
      VM_METRICS_URL: url,
    },
    stackId,
    version: 1,
    victoriaMetrics: {
      binary,
      metricsPath,
      pid,
      storagePath,
      target,
      url,
    },
  };
}

export function buildWorktreeStackPaths({
  repoRoot,
  stackId = createWorktreeStackId(repoRoot),
}) {
  if (!repoRoot) {
    throw new Error("repoRoot is required.");
  }

  const stackRoot = path.join(
    path.resolve(repoRoot),
    ".observability",
    stackId
  );

  return {
    currentPath: path.join(
      path.resolve(repoRoot),
      ".observability",
      "current.json"
    ),
    manifestPath: path.join(stackRoot, "manifest.json"),
    promscrapeConfigPath: path.join(stackRoot, "promscrape.yml"),
    stackRoot,
    victoriaMetricsLogPath: path.join(stackRoot, "victoriametrics.log"),
    victoriaMetricsStoragePath: path.join(stackRoot, "victoriametrics"),
  };
}

export function renderPromscrapeConfig({
  jobName = "agent-demos-web-dev",
  metricsPath = DEFAULT_METRICS_PATH,
  scrapeInterval = DEFAULT_SCRAPE_INTERVAL,
  stackId,
  target,
}) {
  if (!stackId) {
    throw new Error("stackId is required.");
  }

  if (!target) {
    throw new Error("target is required.");
  }

  return [
    "global:",
    `  scrape_interval: ${scrapeInterval}`,
    "scrape_configs:",
    `  - job_name: "${jobName}"`,
    `    metrics_path: "${metricsPath}"`,
    "    static_configs:",
    `      - targets: ["${target}"]`,
    "        labels:",
    `          worktree_stack: "${stackId}"`,
    "",
  ].join("\n");
}

export function renderSkillEnvShell(manifest) {
  const env = manifest.skillEnv;

  return [
    `export VM_METRICS_URL='${escapeShellSingleQuoted(env.VM_METRICS_URL)}'`,
    `export VM_AUTH_HEADER='${escapeShellSingleQuoted(env.VM_AUTH_HEADER)}'`,
    "",
  ].join("\n");
}

function escapeShellSingleQuoted(value) {
  return String(value).replaceAll("'", "'\\''");
}
