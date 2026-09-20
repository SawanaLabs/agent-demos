---
title: Observability Knowledge Protocol
description: Domain-level language and boundaries for the development-only observability harness.
updateAt: 2026-09-21
---

# Observability Knowledge Protocol

## Reading Path

- Read this file before changing development-only telemetry capture, local observability stack scripts, official VictoriaMetrics skill integration, or dev observability APIs.
- For local lifecycle, exposure, storage, and adapter boundaries, read [Development Harness](./development-harness.md) after this file.
- For the first Victoria component integration, read [VictoriaMetrics](./victoriametrics.md) after this file.
- For why observability boundaries and domain scope exist, read the [Decision history](./DOCS.adr.md).

## Domain Language

- **Development Observability Harness**: A development-only local observability stack plus app instrumentation that lets developers and coding agents inspect demo behavior while implementing changes.
  _Avoid_: production observability platform, user-facing trace panel
- **Ephemeral Observability Store**: Local observability data created for one development run, task, or worktree and safe to tear down after the work is complete.
  _Avoid_: product history, analytics warehouse, audit archive
- **Observability Backend Adapter**: The replaceable module boundary that hides VictoriaMetrics, VictoriaLogs, VictoriaTraces, or a future backend behind project-owned capture and query contracts.
  _Avoid_: direct vendor calls from demo feature code
- **Official VictoriaMetrics Skills**: The upstream agent skills installed from `VictoriaMetrics/skills` and used as the standard query surface for metrics, logs, traces, alerts, and observability diagnostics.
  _Avoid_: repo-owned duplicate PromQL, LogsQL, or trace query wrappers
- **Metrics Signal**: Numeric time-series evidence used for latency baselines, thresholds, and before/after comparisons.
  _Avoid_: trace, log event
- **Logs Signal**: Structured event evidence used to understand what happened around an operation or failure.
  _Avoid_: metrics counter, span tree
- **Traces Signal**: Span-level evidence used to understand where time was spent across one request, workflow, or user journey.
  _Avoid_: UI session trace, offline trajectory trace

## Boundary Principles

- Keep the harness development-only. Public production routes and copyable Agent Demo boundaries must not expose the local observability stack by default.
- Derive harness availability from the Next.js/Vercel runtime environment instead of requiring a primary manual enable flag. Local `next dev` is the expected available path; preview and production deployments must stay unavailable.
- Keep app and demo code backend-agnostic. Feature code should call project-owned capture/query helpers instead of depending directly on Victoria APIs.
- Use official VictoriaMetrics skills for agent query workflows. The repository may expose stack discovery or environment output, but it should not reimplement skill-level PromQL, LogsQL, trace, or diagnostics command surfaces.
- Keep metrics, logs, and traces as separate evidence classes. Do not overload one JSON shape or store to serve all three.
- Keep environment access inside `keys.ts` or `env.ts` contract modules when implementation introduces runtime configuration.
- Keep the Development Observability Harness separate from the `trace-eval-agent` product-facing session trace and eval UI.

## Update Triggers

- Update this file when observability-wide language, signal boundaries, adapter ownership, or dev-only exposure rules change.
- Update this file when a decision affects multiple observability subdomains.
