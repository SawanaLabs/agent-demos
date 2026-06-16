import { describe, expect, it } from "vitest";

import { renderDevelopmentObservabilityMetrics } from "./metrics";

describe("development observability metrics", () => {
  it("renders Prometheus text for the local harness", () => {
    const metrics = renderDevelopmentObservabilityMetrics({
      now: new Date("2026-06-16T00:00:01.000Z"),
    });

    expect(metrics).toContain(
      "# HELP dev_observability_harness_info Local development observability harness availability."
    );
    expect(metrics).toContain("# TYPE dev_observability_harness_info gauge");
    expect(metrics).toContain(
      'dev_observability_harness_info{app="agent_demos_web"} 1'
    );
    expect(metrics).toContain(
      "# TYPE dev_observability_scrape_timestamp_seconds gauge"
    );
    expect(metrics).toContain(
      "dev_observability_scrape_timestamp_seconds 1781568001"
    );
    expect(metrics.endsWith("\n")).toBe(true);
  });
});
