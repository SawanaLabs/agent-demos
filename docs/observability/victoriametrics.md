---
title: VictoriaMetrics
description: First metrics backend integration and numeric latency signal boundaries for the development observability harness.
updateAt: 2026-06-16
---

# VictoriaMetrics

## Scope

- Covers VictoriaMetrics as the first backend integrated into the Development Observability Harness.
- Covers numeric metrics used for local latency baselines, thresholds, and before/after comparison.
- Covers the official `victoriametrics-query` skill as the metrics query entry point.
- Does not cover VictoriaLogs, VictoriaTraces, production RUM, or full root-cause analysis by itself.

## Domain Language

- **Latency Baseline Metric**: A numeric measurement captured before optimization so a later change can be compared against the same local workload.
  _Avoid_: anecdotal feel, one-off stopwatch note
- **Responsiveness Metric**: A user-perceived timing measurement such as click-to-ready or submit-to-visible-thinking.
  _Avoid_: backend-only duration when the UI delay is the actual question
- **Metrics Query Skill**: The upstream `victoriametrics-query` skill installed from `VictoriaMetrics/skills`, used for PromQL/MetricsQL queries and VictoriaMetrics API exploration.
  _Avoid_: project-owned PromQL wrapper

## Current Subdomain Docs

- Integrate VictoriaMetrics before optimizing the first two latency scenarios so the project can measure baseline behavior first.
- Use metrics for questions that need thresholds or trend comparison, such as whether a local workflow stays below a target duration.
- Keep VictoriaMetrics behind an Observability Backend Adapter. Demo feature code should not build Prometheus-compatible requests directly.
- Query VictoriaMetrics through the official `victoriametrics-query` skill. The harness should provide `VM_METRICS_URL` and `VM_AUTH_HEADER`; it should not add a broad repository-owned metrics query CLI.
- Metrics can show that latency exists and whether it improved. Use traces or logs later when the question becomes where time was spent or what event caused the delay.
- The installed skill expects a VictoriaMetrics base URL, for example `VM_METRICS_URL=http://localhost:8428` for single-node local use, and an empty `VM_AUTH_HEADER` for local unauthenticated use.
- The app exposes the first Prometheus-compatible development metrics route at `/api/dev/observability/metrics`.
- The route is available only when `NODE_ENV=development` and any present Vercel environment context also resolves to `development`. Other runtimes receive a `404` JSON response with `cache-control: no-store`.
- The first exported metrics are `dev_observability_harness_info{app="agent_demos_web"} 1` and `dev_observability_scrape_timestamp_seconds`.
- Start the current worktree stack with `pnpm observability:up`, then export the printed values or run `pnpm observability:env` before using the official `victoriametrics-query` skill.
- If the app is not on port 3000, set `NEXTJS_METRICS_TARGET=127.0.0.1:<port>` before `pnpm observability:up`.
- Quick local proof query after one scrape interval:
  `curl -s ${VM_AUTH_HEADER:+-H} ${VM_AUTH_HEADER:+"$VM_AUTH_HEADER"} --get --data-urlencode 'query=dev_observability_harness_info' "$VM_METRICS_URL/api/v1/query" | jq .`
- Initial local scenarios to measure after the metrics backend exists:
  - Homepage demo-card click to target demo workspace ready.
  - Demo message submit to visible thinking or first streaming feedback.

## Update Triggers

- Update this file when metric names, label rules, query helpers, or VictoriaMetrics lifecycle expectations become stable.
- Update this file when a new latency workflow becomes part of the harness contract.
