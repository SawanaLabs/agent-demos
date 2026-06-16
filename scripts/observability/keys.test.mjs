import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_METRICS_TARGET,
  readObservabilityProcessConfig,
} from "./keys.mjs";

test("reads observability script config from an explicit env record", () => {
  assert.deepEqual(readObservabilityProcessConfig({}), {
    metricsTarget: DEFAULT_METRICS_TARGET,
    victoriaMetricsBinary: undefined,
  });

  assert.deepEqual(
    readObservabilityProcessConfig({
      NEXTJS_METRICS_TARGET: "127.0.0.1:3001",
      OBSERVABILITY_METRICS_TARGET: "127.0.0.1:3002",
      VICTORIA_METRICS_BIN: "/opt/vm/bin/victoria-metrics",
    }),
    {
      metricsTarget: "127.0.0.1:3001",
      victoriaMetricsBinary: "/opt/vm/bin/victoria-metrics",
    }
  );
});
