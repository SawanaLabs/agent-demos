import fs from "node:fs";
import path from "node:path";

const copyBoundaryRoots = ["registry", "apps/web/public/r"];
const forbiddenTokens = [
  "@/features/shared/observability/server/",
  "@next/third-parties",
  "GoogleAnalytics",
  "NEXT_PUBLIC_GA_",
  "client.runtime_failed",
  "demo.provider_failed",
  "demo.runtime_failed",
  "demo.storage_failed",
  "demo.tool_failed",
  "demo_action",
  "dataLayer.push",
  "google-analytics.com",
  "googletagmanager.com",
  "gtag(",
  "gtag (",
  "renderDevelopmentObservabilityMetrics",
  "runtimeErrorLogger",
  "sendGAEvent",
  "site-analytics",
  "site-runtime-logging",
  "window.gtag",
];

function visitFiles(directory, files) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Missing telemetry copy boundary: ${directory}`);
  }

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(
        `Symlinks are not allowed in telemetry copy boundaries: ${absolutePath}`
      );
    }

    if (entry.isDirectory()) {
      visitFiles(absolutePath, files);
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
}

function isBinary(content) {
  return content.includes(0);
}

export function findHostTelemetryLeaks(repoRoot) {
  const files = [];

  for (const copyBoundaryRoot of copyBoundaryRoots) {
    visitFiles(path.join(repoRoot, copyBoundaryRoot), files);
  }

  const leaks = [];

  for (const filePath of files.sort()) {
    const relativePath = path
      .relative(repoRoot, filePath)
      .split(path.sep)
      .join("/");
    const rawContent = fs.readFileSync(filePath);
    const content = isBinary(rawContent) ? "" : rawContent.toString("utf8");

    for (const token of forbiddenTokens) {
      if (relativePath.includes(token) || content.includes(token)) {
        leaks.push({
          path: relativePath,
          token,
        });
      }
    }
  }

  return leaks;
}
