---
title: Monorepo
description: Durable conventions for the pnpm and Turborepo workspace structure.
updateAt: 2026-05-21
---

# Monorepo

## Scope

- Covers `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `apps/web`, and `packages/*`.
- Covers where reusable code should live and which root commands future agents should prefer.

## Current Subdomain Docs

- The workspace includes `apps/*` and `packages/*` from `pnpm-workspace.yaml`.
- `apps/web` is the Next.js app package.
- `packages/ui` is the reusable UI package consumed through `@workspace/ui`.
- `packages/typescript-config` provides shared TypeScript configs for workspace packages.
- `packages/eslint-config` is still present for template compatibility, but the root quality gate is Ultracite.
- Root scripts coordinate shared workflows:
  - `pnpm dev` runs Turbo dev tasks.
  - `pnpm build` runs Turbo build tasks.
  - `pnpm typecheck` runs Turbo typecheck tasks.
  - `pnpm lint` and `pnpm check` run `ultracite check`.
  - `pnpm format` and `pnpm fix` run `ultracite fix`.
- For a single-package web dev server, use `pnpm --filter web dev`. If the default port is occupied, use `pnpm --filter web exec next dev --turbopack --port <port>`.

## Update Triggers

- Update this file when workspace packages are added, removed, or renamed.
- Update this file when root scripts, Turbo tasks, or package ownership boundaries change.
