const DEFAULT_APP_LABEL = "agent_demos_web";

export interface DevelopmentMetricsOptions {
  now?: Date;
}

export function renderDevelopmentObservabilityMetrics({
  now = new Date(),
}: DevelopmentMetricsOptions = {}): string {
  const timestampSeconds = Math.floor(now.getTime() / 1000);

  return [
    "# HELP dev_observability_harness_info Local development observability harness availability.",
    "# TYPE dev_observability_harness_info gauge",
    `dev_observability_harness_info{app="${DEFAULT_APP_LABEL}"} 1`,
    "# HELP dev_observability_scrape_timestamp_seconds Unix timestamp when the development observability metrics endpoint was scraped.",
    "# TYPE dev_observability_scrape_timestamp_seconds gauge",
    `dev_observability_scrape_timestamp_seconds ${timestampSeconds}`,
    "",
  ].join("\n");
}
