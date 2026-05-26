---
title: Repo Knowledge Protocol
description: Domain-level language, reading path, and boundary principles for repository layout and workspace workflow.
updateAt: 2026-05-26
---

# Repo Knowledge Protocol

## Reading Path

- Read this file before changing workspace layout, package boundaries, root scripts, Turborepo tasks, workspace package exports, or dependency ownership.
- For concrete workspace packages, root commands, Turbo tasks, and database package env loading, read [Monorepo](./monorepo.md) after this file.

## Domain Language

- **Workspace package**: A package under `apps/*` or `packages/*` managed by the root pnpm workspace.
- **App package**: A deployable or runnable application package under `apps/*`; today the main app is `apps/web`.
- **Shared package**: A reusable package under `packages/*` that exposes contracts consumed by one or more app packages.

## Boundary Principles

- Treat the pnpm workspace and Turborepo configuration as the repository coordination layer. Prefer root commands for shared workflows.
- Keep package ownership explicit. App-specific routes and product behavior belong in `apps/web`; reusable package contracts belong under `packages/*`.
- Keep package export paths as runtime contracts. Do not add file extensions or deep imports unless the package export map exposes them.
- Add new workspace packages only when ownership is stable enough to justify a package boundary.
- Keep repository-level docs at the boundary and workflow level; put domain-specific frontend or quality rules in their matching domain protocol.

## Update Triggers

- Update this file when workspace ownership, package boundary policy, root workflow policy, or package export policy changes.
- Update [Monorepo](./monorepo.md) when workspace packages, root scripts, Turbo tasks, or database package environment loading changes.
