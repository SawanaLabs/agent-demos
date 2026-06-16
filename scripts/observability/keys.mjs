export const DEFAULT_METRICS_TARGET = "127.0.0.1:3000";

export function readObservabilityProcessConfig(env = process.env) {
  return {
    metricsTarget:
      env.NEXTJS_METRICS_TARGET ??
      env.OBSERVABILITY_METRICS_TARGET ??
      DEFAULT_METRICS_TARGET,
    victoriaMetricsBinary: env.VICTORIA_METRICS_BIN,
  };
}
