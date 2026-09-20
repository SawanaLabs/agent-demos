---
title: Development Harness
description: Development-only lifecycle, exposure, storage, and adapter boundaries for the observability harness.
updateAt: 2026-09-21
---

# Development Harness

## Scope

- Covers the local, development-only observability harness for this repository.
- Covers lifecycle, exposure, storage, and replaceable backend boundaries for metrics, logs, and traces.
- Does not cover public production observability, product analytics, or the `trace-eval-agent` user-facing trace/eval panel.
- Scoped decisions are preserved in the adjacent [Decision history](./development-harness.adr.md).

## Domain Language

- **Harness Run**: One local development session where the app and observability stack collect evidence for implementation work.
  _Avoid_: production deployment, user session
- **Worktree Observability Stack**: A local stack instance scoped to a worktree or task so concurrent development work can avoid data and port collisions.
  _Avoid_: shared production stack, global daemon
- **Development Observability API**: A route or tool endpoint available only when the app is running in the local development runtime.
  _Avoid_: public API, registry API
- **Skill Environment Contract**: The local environment variables and discovery output needed by official VictoriaMetrics skills to query the current worktree stack.
  _Avoid_: repo-owned query DSL, duplicated query CLI

## Current Subdomain Docs

- The harness is for development feedback loops: implement, run a workload, query signals, adjust code, and rerun.
- Harness data is temporary. It should be safe to delete after the task, worktree, or local run completes.
- The harness should fail closed outside local development. If a dev-only route or query helper is called from preview, production, or test runtime, return an explicit unavailable response instead of silently falling back.
- Do not require a primary `OBSERVABILITY_HARNESS_ENABLED` style switch. Availability should be derived from the runtime environment, using Next.js `NODE_ENV=development` as the stable local development signal and Vercel environment variables only as deployment context when present.
- Keep backend-specific endpoints behind project-owned adapters so Victoria services can be replaced later with a mature alternative.
- Keep query execution in official VictoriaMetrics skills. Harness lifecycle scripts may start, stop, and describe local services, but they should not duplicate the skills' query command surface.
- When the harness starts a local stack, expose the variables expected by the official skills: `VM_METRICS_URL` for VictoriaMetrics, later `VM_LOGS_URL` for VictoriaLogs, `VM_TRACES_URL` for VictoriaTraces, and `VM_AUTH_HEADER` as empty for local unauthenticated use.
- Keep metrics, logs, and traces independently optional. Adding one signal should not force the other two into the app runtime.
- The harness should not redefine the existing `trace-eval-agent` session trace contract. Product-facing trace/eval state remains separate from exported observability signals.
- The current VictoriaMetrics lifecycle scripts are:
  - `pnpm observability:up`: start a per-worktree VictoriaMetrics process and print official-skill environment exports.
  - `pnpm observability:env`: print the current stack's official-skill environment exports, or `--json` for structured tooling.
  - `pnpm observability:down`: stop the current worktree stack and delete its temporary storage.
  - `pnpm dev:observability`: start the stack and then run the normal dev command, tearing down the stack when the dev command exits.
- Stack state lives under `.observability/<worktree-stack-id>/` and is ignored by git. The stack id is derived from the resolved repo root so separate worktrees get separate storage.
- The default metrics scrape target is `127.0.0.1:3000`. Use `NEXTJS_METRICS_TARGET=127.0.0.1:<port>` or `OBSERVABILITY_METRICS_TARGET=127.0.0.1:<port>` when the web app runs on another port.
- The VictoriaMetrics executable is discovered from `VICTORIA_METRICS_BIN`, then `victoria-metrics`, then `victoria-metrics-prod`.

## Update Triggers

- Update this file when harness lifecycle, storage scope, enabled/disabled behavior, dev API exposure, or adapter ownership changes.
- Update this file when a Victoria backend becomes mandatory or optional in a new way.
