---
title: Decision History
description: Historical reasoning for the adjacent living document.
updateAt: 2026-09-21
---

# Decision History

[Current documentation](./development-harness.md)

## 2026-06-16 development-only-harness

Treat observability stack data and APIs as development-only.

- Status: Accepted
- Context: The project wants Codex-style local observability for implementation work while avoiding public exposure and long-term data-retention obligations.
- Decision: Keep the harness behind development configuration and treat collected data as ephemeral.
- Consequences: Production latency questions may need separate production evidence later, while local harness work can stay smaller, cheaper, and easier to tear down.

## 2026-06-16 auto-development-availability

Derive harness availability from the runtime environment.

- Status: Accepted
- Context: A manual harness switch would create an extra setup step and a production exposure footgun, while Next.js and Vercel already distinguish local development, preview, and production environments.
- Decision: Do not introduce a primary manual enable flag for harness availability. Use the local development runtime as the availability signal and make non-development runtimes fail closed.
- Consequences: Local development becomes lower-friction, while intentional non-local observability experiments would require a separate future decision.

## 2026-06-16 skill-query-boundary

Keep repository harness code out of the official query surface.

- Status: Accepted
- Context: The project needs a local per-worktree stack, while VictoriaMetrics already maintains agent skills for querying and diagnostics.
- Decision: Repository scripts own stack lifecycle and skill environment discovery. Official VictoriaMetrics skills own metrics, logs, traces, alert, cardinality, and diagnostics queries.
- Consequences: A future `observability:query` script should be avoided unless it is a tiny compatibility shim. Prefer an env/manifest output command that lets the official skills talk to the current stack.

## 2026-06-16 victoriametrics-host-binary-runner

Start VictoriaMetrics with a local executable first.

- Status: Accepted
- Context: The first integration needs the smallest reliable loop for local development and worktree-scoped storage. Docker may be unavailable on a developer machine even when a Homebrew or manually installed VictoriaMetrics binary exists.
- Decision: Use a host VictoriaMetrics executable for the initial lifecycle runner, with `VICTORIA_METRICS_BIN` as the explicit override path.
- Consequences: Developers need the binary installed locally. A future container runner can be added behind the lifecycle script without changing app metrics exposure or official-skill query contracts.
