import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVictoriaMetricsManifest,
  createWorktreeStackId,
  renderPromscrapeConfig,
  renderSkillEnvShell,
} from "./worktree-stack.mjs";

const STACK_ID_PATTERN = /^worktree-[a-f0-9]{12}$/;
const DEFAULT_TARGET_PATTERN = /targets: \["127\.0\.0\.1:3000"\]/;

test("builds a per-worktree VictoriaMetrics contract for official skills", () => {
  const repoRoot = "/tmp/agent-demos";
  const stackId = createWorktreeStackId(repoRoot);

  assert.match(stackId, STACK_ID_PATTERN);
  assert.equal(stackId, createWorktreeStackId(repoRoot));
  assert.notEqual(stackId, createWorktreeStackId("/tmp/agent-demos-copy"));

  const manifest = buildVictoriaMetricsManifest({
    metricsPort: 18_428,
    pid: 1234,
    repoRoot,
    stackId,
    target: "127.0.0.1:3000",
  });

  assert.equal(manifest.skillEnv.VM_METRICS_URL, "http://127.0.0.1:18428");
  assert.equal(manifest.skillEnv.VM_AUTH_HEADER, "");
  assert.equal(
    manifest.victoriaMetrics.metricsPath,
    "/api/dev/observability/metrics"
  );

  assert.equal(
    renderSkillEnvShell(manifest),
    [
      "export VM_METRICS_URL='http://127.0.0.1:18428'",
      "export VM_AUTH_HEADER=''",
      "",
    ].join("\n")
  );

  assert.match(
    renderPromscrapeConfig({
      metricsPath: manifest.victoriaMetrics.metricsPath,
      stackId,
      target: manifest.victoriaMetrics.target,
    }),
    DEFAULT_TARGET_PATTERN
  );
});
