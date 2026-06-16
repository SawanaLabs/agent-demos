#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import net from "node:net";

import { readObservabilityProcessConfig } from "./keys.mjs";
import {
  buildVictoriaMetricsManifest,
  buildWorktreeStackPaths,
  createWorktreeStackId,
  renderPromscrapeConfig,
  renderSkillEnvShell,
} from "./worktree-stack.mjs";

const HEALTH_TIMEOUT_MS = 10_000;

async function main() {
  const config = readObservabilityProcessConfig();
  const repoRoot = findRepoRoot();
  const stackId = createWorktreeStackId(repoRoot);
  const paths = buildWorktreeStackPaths({ repoRoot, stackId });

  if (existsSync(paths.manifestPath)) {
    const existingManifest = readManifest(paths.manifestPath);

    if (isProcessRunning(existingManifest.victoriaMetrics.pid)) {
      process.stdout.write(renderSkillEnvShell(existingManifest));
      return;
    }

    throw new Error(
      `Found stale observability manifest at ${paths.manifestPath}. Run pnpm observability:down before starting a new stack.`
    );
  }

  const binary = findVictoriaMetricsBinary(config.victoriaMetricsBinary);
  const metricsPort = await findFreePort();
  const target = config.metricsTarget;

  mkdirSync(paths.stackRoot, { recursive: true });
  writeFileSync(
    paths.promscrapeConfigPath,
    renderPromscrapeConfig({ stackId, target }),
    "utf8"
  );

  const logFd = openSync(paths.victoriaMetricsLogPath, "a");
  const child = spawn(
    binary,
    [
      `-httpListenAddr=127.0.0.1:${metricsPort}`,
      `-storageDataPath=${paths.victoriaMetricsStoragePath}`,
      "-retentionPeriod=1d",
      `-promscrape.config=${paths.promscrapeConfigPath}`,
    ],
    {
      detached: true,
      stdio: ["ignore", logFd, logFd],
    }
  );
  closeSync(logFd);
  child.unref();

  const manifest = buildVictoriaMetricsManifest({
    binary,
    metricsPort,
    pid: child.pid,
    repoRoot,
    stackId,
    storagePath: paths.victoriaMetricsStoragePath,
    target,
  });

  writeJson(paths.manifestPath, manifest);
  writeJson(paths.currentPath, {
    manifestPath: paths.manifestPath,
    stackId,
  });

  try {
    await waitForVictoriaMetricsHealth(manifest.victoriaMetrics.url);
  } catch (error) {
    terminateProcess(child.pid);
    throw error;
  }

  process.stdout.write(renderSkillEnvShell(manifest));
}

function findRepoRoot() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
}

function findVictoriaMetricsBinary(explicitPath) {
  if (explicitPath) {
    return explicitPath;
  }

  for (const name of ["victoria-metrics", "victoria-metrics-prod"]) {
    try {
      return execFileSync("which", [name], { encoding: "utf8" }).trim();
    } catch {
      // Try the next known binary name.
    }
  }

  throw new Error(
    "VictoriaMetrics binary not found. Install it or set VICTORIA_METRICS_BIN to the executable path."
  );
}

function readManifest(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function terminateProcess(pid) {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Process already exited.
  }
}

async function findFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() =>
          reject(new Error("Failed to allocate a local TCP port."))
        );
        return;
      }

      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

async function waitForVictoriaMetricsHealth(url) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/health`);

      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(
    `VictoriaMetrics did not become healthy at ${url}/health. Last error: ${
      lastError instanceof Error ? lastError.message : "health check failed"
    }`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
