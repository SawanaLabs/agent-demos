import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { findHostTelemetryLeaks } from "./host-telemetry-isolation.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const forbiddenTokenSamples = [
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
const textExtensions = [".py", ".yaml", ".svg", ".txt", ".ts"];
const missingBoundaryPattern = /Missing telemetry copy boundary/u;
const disallowedSymlinkPattern = /Symlinks are not allowed/u;

function createBoundaryRoots(fixtureRoot) {
  fs.mkdirSync(path.join(fixtureRoot, "registry"), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, "apps/web/public/r"), {
    recursive: true,
  });
}

test("detects every host telemetry marker across source and generated boundaries", async () => {
  const fixtureRoot = await mkdtemp(
    path.join(os.tmpdir(), "host-telemetry-isolation-")
  );

  try {
    createBoundaryRoots(fixtureRoot);

    forbiddenTokenSamples.forEach((token, index) => {
      const extension = textExtensions[index % textExtensions.length];
      const markerPath = path.join(
        fixtureRoot,
        `registry/demo/marker-${index}${extension}`
      );

      fs.mkdirSync(path.dirname(markerPath), { recursive: true });
      fs.writeFileSync(markerPath, `host marker: ${token}\n`);
    });

    fs.writeFileSync(
      path.join(fixtureRoot, "apps/web/public/r/generated.json"),
      JSON.stringify({ transport: "sendGAEvent" })
    );

    const leaks = findHostTelemetryLeaks(fixtureRoot);

    for (const token of forbiddenTokenSamples) {
      assert.ok(
        leaks.some((leak) => leak.token === token),
        token
      );
    }
    assert.ok(
      leaks.some(
        (leak) =>
          leak.path === "apps/web/public/r/generated.json" &&
          leak.token === "sendGAEvent"
      )
    );
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
});

test("detects the host-only development observability adapter in both copy boundaries", async () => {
  const fixtureRoot = await mkdtemp(
    path.join(os.tmpdir(), "host-observability-isolation-")
  );

  try {
    createBoundaryRoots(fixtureRoot);

    const registryAdapterPath = path.join(
      fixtureRoot,
      "registry/demo/observability-adapter.ts"
    );
    const generatedAdapterPath = path.join(
      fixtureRoot,
      "apps/web/public/r/generated.json"
    );

    fs.mkdirSync(path.dirname(registryAdapterPath), { recursive: true });
    fs.writeFileSync(
      registryAdapterPath,
      'import { metrics } from "@/features/shared/observability/server/metrics";\n'
    );
    fs.writeFileSync(
      generatedAdapterPath,
      JSON.stringify({ transport: "renderDevelopmentObservabilityMetrics" })
    );

    assert.deepEqual(findHostTelemetryLeaks(fixtureRoot), [
      {
        path: "apps/web/public/r/generated.json",
        token: "renderDevelopmentObservabilityMetrics",
      },
      {
        path: "registry/demo/observability-adapter.ts",
        token: "@/features/shared/observability/server/",
      },
    ]);
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
});

test("detects path-only host telemetry and ignores binary payload bytes", async () => {
  const fixtureRoot = await mkdtemp(
    path.join(os.tmpdir(), "host-telemetry-path-")
  );

  try {
    createBoundaryRoots(fixtureRoot);
    const pathOnlyLeak = path.join(
      fixtureRoot,
      "registry/demo/site-analytics/adapter.ts"
    );
    const binaryAsset = path.join(fixtureRoot, "registry/demo/image.png");

    fs.mkdirSync(path.dirname(pathOnlyLeak), { recursive: true });
    fs.writeFileSync(pathOnlyLeak, "export {};\n");
    fs.writeFileSync(
      binaryAsset,
      Buffer.concat([Buffer.from("sendGAEvent"), Buffer.from([0, 1, 2])])
    );

    assert.deepEqual(findHostTelemetryLeaks(fixtureRoot), [
      {
        path: "registry/demo/site-analytics/adapter.ts",
        token: "site-analytics",
      },
    ]);
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
});

test("fails closed for a missing boundary or a symlink", async () => {
  const missingRoot = await mkdtemp(
    path.join(os.tmpdir(), "host-telemetry-missing-")
  );
  const symlinkRoot = await mkdtemp(
    path.join(os.tmpdir(), "host-telemetry-symlink-")
  );

  try {
    fs.mkdirSync(path.join(missingRoot, "registry"));
    assert.throws(
      () => findHostTelemetryLeaks(missingRoot),
      missingBoundaryPattern
    );

    createBoundaryRoots(symlinkRoot);
    const target = path.join(symlinkRoot, "host-adapter.ts");
    fs.writeFileSync(target, "export {};\n");
    fs.symlinkSync(target, path.join(symlinkRoot, "registry/host-adapter.ts"));

    assert.throws(
      () => findHostTelemetryLeaks(symlinkRoot),
      disallowedSymlinkPattern
    );
  } finally {
    await rm(missingRoot, { force: true, recursive: true });
    await rm(symlinkRoot, { force: true, recursive: true });
  }
});

test("keeps repository registry outputs free of host telemetry", () => {
  assert.deepEqual(findHostTelemetryLeaks(repoRoot), []);
});
