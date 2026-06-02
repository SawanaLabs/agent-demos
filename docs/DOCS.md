---
title: Project Knowledge Protocol
description: Cross-domain language, collaboration conventions, and repository boundary rules.
updateAt: 2026-06-02
---

# Project Knowledge Protocol

## Business Context

- [Root Context](../CONTEXT.md) is the canonical business agreement for this repository.
- Read `CONTEXT.md` before changing the homepage, demo catalog, demo page shape, demo selection workflow, copy boundaries, or agent-demo terminology.
- Treat `CONTEXT.md` as binding project language. Implementation docs can refine how the agreement is built, but they must not redefine product terms or weaken business boundaries from `CONTEXT.md`.
- If code, docs, or a proposed implementation conflicts with `CONTEXT.md`, stop and resolve the business language first.

## Domain Language

- **Workspace package**: A package under `apps/*` or `packages/*` managed by the root pnpm workspace.
- **Root quality gate**: The root-level Ultracite and TypeScript workflow, exposed through `pnpm lint`, `pnpm check`, `pnpm format`, `pnpm fix`, and `pnpm typecheck`.
- **Shared UI package**: `packages/ui`, the frontend primitive layer for reusable shadcn, AI Elements, Tailwind, hook, and UI utility exports consumed by `apps/web`.

## Collaboration Conventions

- Treat this repository as a pnpm/Turborepo monorepo. Prefer root commands unless a package-specific command is needed.
- Use `pnpm` for Node dependency and script workflows.
- Use `uv` CLI first for Python environment management if Python tooling is introduced.
- Keep durable project corrections in `docs/` during the same task when possible.
- If a command fails with a likely network issue, retry once before treating it as a real blocker.
- Prefer explicit errors over fallback behavior that hides broken contracts.
- Keep tests focused on the core contract surface instead of adding broad test volume by default.

## Completion Checks

- After code changes, run `pnpm check` or `pnpm lint`, plus `pnpm typecheck`, unless the change is docs-only or the user explicitly narrows scope.
- Run focused Vitest tests for touched contract surfaces when they exist; add a small contract test when core behavior changes without useful coverage.
- For provider, sandbox, database, cross-module, UI, or complete-flow changes, choose the next evidence layer from [Quality Knowledge Protocol](./quality/DOCS.md): integration test, browser QA, or E2E.
- Final responses must state which checks ran, which checks were skipped with reasons, and any remaining quality risk.

## Boundary Principles

- Shared UI primitive and wrapper placement rules live in `docs/frontend/DOCS.md`; read that domain protocol before changing `packages/ui`, frontend wrappers, shadcn components, AI Elements components, Tailwind setup, or frontend imports.
- Application routes, app-specific providers, and app-specific wrappers belong in `apps/web`.
- Environment-variable contracts belong in `keys.ts` and `env.ts` modules. Feature routes, runtime modules, and model/chat helpers should consume those modules instead of reading `process.env` directly.
- Quality tooling is rooted at the repository root. Package scripts should delegate to the root quality gate when they need the shared Ultracite config.
- Package export paths are runtime contracts. Do not add file extensions to workspace export-map imports unless the package export map actually exposes those paths.
- Keep docs maps complete. Adding or removing a first-level domain requires `docs/index.md` updates, and adding or removing a subdomain file requires the matching `docs/<domain>/index.md` update.
