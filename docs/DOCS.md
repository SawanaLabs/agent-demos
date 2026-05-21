---
title: Project Knowledge Protocol
description: Cross-domain language, collaboration conventions, and repository boundary rules.
updateAt: 2026-05-21
---

# Project Knowledge Protocol

## Domain Language

- **Workspace package**: A package under `apps/*` or `packages/*` managed by the root pnpm workspace.
- **Root quality gate**: The root-level Ultracite check and fix workflow, exposed through `pnpm lint`, `pnpm check`, `pnpm format`, and `pnpm fix`.
- **Shared UI package**: `packages/ui`, the reusable shadcn/Tailwind component package consumed by `apps/web`.

## Collaboration Conventions

- Treat this repository as a pnpm/Turborepo monorepo. Prefer root commands unless a package-specific command is needed.
- Use `pnpm` for Node dependency and script workflows.
- Use `uv` CLI first for Python environment management if Python tooling is introduced.
- Keep durable project corrections in `docs/` during the same task when possible.
- If a command fails with a likely network issue, retry once before treating it as a real blocker.
- Prefer explicit errors over fallback behavior that hides broken contracts.
- Keep tests focused on the core contract surface instead of adding broad test volume by default.

## Boundary Principles

- Shared components, Tailwind primitives, UI hooks, and shared UI utilities belong in `packages/ui`.
- Application routes, app-specific providers, and app-specific wrappers belong in `apps/web`.
- Quality tooling is rooted at the repository root. Package scripts should delegate to the root quality gate when they need the shared Ultracite config.
- Package export paths are runtime contracts. Do not add file extensions to workspace export-map imports unless the package export map actually exposes those paths.
- Keep docs maps complete. Adding or removing a first-level domain requires `docs/index.md` updates, and adding or removing a subdomain file requires the matching `docs/<domain>/index.md` update.
