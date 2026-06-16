---
title: Development Harness
description: Development-only lifecycle, exposure, storage, and adapter boundaries for the observability harness.
updateAt: 2026-06-16
---

# Development Harness

## Scope

- Covers the local, development-only observability harness for this repository.
- Covers lifecycle, exposure, storage, and replaceable backend boundaries for metrics, logs, and traces.
- Does not cover public production observability, product analytics, or the `trace-eval-agent` user-facing trace/eval panel.

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

## Decision Records

- **2026-06-16-development-only-harness**: Treat observability stack data and APIs as development-only.
  Status: Accepted
  Context: The project wants Codex-style local observability for implementation work while avoiding public exposure and long-term data-retention obligations.
  Decision: Keep the harness behind development configuration and treat collected data as ephemeral.
  Consequences: Production latency questions may need separate production evidence later, while local harness work can stay smaller, cheaper, and easier to tear down.
- **2026-06-16-auto-development-availability**: Derive harness availability from the runtime environment.
  Status: Accepted
  Context: A manual harness switch would create an extra setup step and a production exposure footgun, while Next.js and Vercel already distinguish local development, preview, and production environments.
  Decision: Do not introduce a primary manual enable flag for harness availability. Use the local development runtime as the availability signal and make non-development runtimes fail closed.
  Consequences: Local development becomes lower-friction, while intentional non-local observability experiments would require a separate future decision.
- **2026-06-16-skill-query-boundary**: Keep repository harness code out of the official query surface.
  Status: Accepted
  Context: The project needs a local per-worktree stack, while VictoriaMetrics already maintains agent skills for querying and diagnostics.
  Decision: Repository scripts own stack lifecycle and skill environment discovery. Official VictoriaMetrics skills own metrics, logs, traces, alert, cardinality, and diagnostics queries.
  Consequences: A future `observability:query` script should be avoided unless it is a tiny compatibility shim. Prefer an env/manifest output command that lets the official skills talk to the current stack.
- **2026-06-16-victoriametrics-host-binary-runner**: Start VictoriaMetrics with a local executable first.
  Status: Accepted
  Context: The first integration needs the smallest reliable loop for local development and worktree-scoped storage. Docker may be unavailable on a developer machine even when a Homebrew or manually installed VictoriaMetrics binary exists.
  Decision: Use a host VictoriaMetrics executable for the initial lifecycle runner, with `VICTORIA_METRICS_BIN` as the explicit override path.
  Consequences: Developers need the binary installed locally. A future container runner can be added behind the lifecycle script without changing app metrics exposure or official-skill query contracts.

## Update Triggers

- Update this file when harness lifecycle, storage scope, enabled/disabled behavior, dev API exposure, or adapter ownership changes.
- Update this file when a Victoria backend becomes mandatory or optional in a new way.
