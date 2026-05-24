---
title: Monorepo
description: Durable conventions for the pnpm and Turborepo workspace structure.
updateAt: 2026-05-22
---

# Monorepo

## Scope

- Covers `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `apps/web`, and `packages/*`.
- Covers where reusable code should live and which root commands future agents should prefer.

## Current Subdomain Docs

- The workspace includes `apps/*` and `packages/*` from `pnpm-workspace.yaml`.
- `apps/web` is the Next.js app package.
- `packages/ui` is the reusable UI package consumed through `@workspace/ui`.
- `packages/database` is the Drizzle/Neon database package consumed through `@workspace/database`; its schema is still intentionally empty until product data models become concrete.
- `packages/typescript-config` provides shared TypeScript configs for workspace packages.
- `packages/eslint-config` is still present for template compatibility, but the root quality gate is Ultracite.
- Root scripts coordinate shared workflows:
  - `pnpm dev` runs Turbo dev tasks.
  - `pnpm build` runs Turbo build tasks.
  - `pnpm typecheck` runs Turbo typecheck tasks.
  - `pnpm lint` and `pnpm check` run `ultracite check`.
  - `pnpm format` and `pnpm fix` run `ultracite fix`.
  - `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:pull`, `pnpm db:push`, and `pnpm db:studio` delegate to `@workspace/database`.
- `pnpm --filter web dev` runs the web app on port `3000`. If that port is occupied, stop the stale process before starting another dev server.
- For database package work, keep `DATABASE_URL` in `packages/database/.env.local`, root `.env.local`, `packages/database/.env`, or root `.env`; `packages/database/drizzle.config.ts` loads those files in that precedence order.

## Update Triggers

- Update this file when workspace packages are added, removed, or renamed.
- Update this file when root scripts, Turbo tasks, or package ownership boundaries change.
