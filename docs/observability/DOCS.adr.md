---
title: Decision History
description: Historical reasoning for the adjacent living document.
updateAt: 2026-09-21
---

# Decision History

[Current documentation](./DOCS.md)

## 2026-06-16 observability-domain

Create a first-level Observability docs domain for the development-only harness.

- Status: Accepted
- Context: The harness spans frontend interactions, server routes, local stack lifecycle, metrics/logs/traces query APIs, and future backend replacement.
- Decision: Track this work under `docs/observability/` instead of folding it into `quality` or `frontend`.
- Consequences: New observability docs must keep `docs/index.md` and `docs/observability/index.md` complete, and future VictoriaLogs/VictoriaTraces docs should be added only when their integration boundaries are being worked.

## 2026-06-16 official-victoriametrics-skills

Use upstream VictoriaMetrics agent skills as the query layer.

- Status: Accepted
- Context: VictoriaMetrics maintains official skills for metrics, logs, traces, alerts, and diagnostics. Rebuilding equivalent query commands inside this repository would duplicate an upstream tool surface and increase migration work.
- Decision: Install skills with `npx skills add VictoriaMetrics/skills` and treat those skills as the query entry point. Keep repository work focused on local stack lifecycle, dev-only app exposure, backend adapters, and environment discovery.
- Consequences: Harness scripts should set or print the variables expected by the skills, such as `VM_METRICS_URL`, `VM_LOGS_URL`, `VM_TRACES_URL`, `VM_ALERTMANAGER_URL`, and `VM_AUTH_HEADER`, instead of adding broad `observability:query` wrappers.
