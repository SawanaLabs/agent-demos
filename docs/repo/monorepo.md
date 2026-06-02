---
title: Monorepo
description: Durable conventions for the pnpm and Turborepo workspace structure.
updateAt: 2026-06-02
---

# Monorepo

## Scope

- Covers `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `apps/web`, and `packages/*`.
- Covers where reusable code should live and which root commands future agents should prefer.

## Current Subdomain Docs

- The workspace includes `apps/*` and `packages/*` from `pnpm-workspace.yaml`.
- The public GitHub repository is `https://github.com/SawanaLabs/agent-demos`; keep the root package name, registry manifest `homepage`, and registry guide GitHub source link aligned with that repository identity.
- The public shadcn registry namespace remains `@ai-sdk-6-demos`, and the production registry host remains `agent-demos.hsawana9.com` unless the distribution contract itself changes.
- `apps/web` is the Next.js app package.
- `packages/ui` is the reusable UI package consumed through `@workspace/ui`.
- `packages/database` is the Drizzle/Neon database package consumed through `@workspace/database`; it owns the shared schema barrel and Drizzle CLI integration for the demos that persist data.
- `packages/typescript-config` provides shared TypeScript configs for workspace packages.
- `packages/eslint-config` is still present for template compatibility, but the root quality gate is Ultracite.
- Root scripts coordinate shared workflows:
  - `pnpm dev` runs Turbo dev tasks.
  - `pnpm dev:langgraph-agent` runs the local LangGraph Python backend and the paired Next.js frontend together.
  - `pnpm dev:langgraph-agent-fastapi` runs the Vercel-compatible FastAPI LangGraph backend and the paired Next.js frontend together.
  - `pnpm dev:langchain-agent` is a compatibility alias for `pnpm dev:langgraph-agent`.
  - `pnpm build` runs Turbo build tasks.
  - `pnpm typecheck` runs Turbo typecheck tasks.
  - `pnpm lint` and `pnpm check` run `ultracite check`.
  - `pnpm format` and `pnpm fix` run `ultracite fix`.
  - `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:pull`, `pnpm db:push`, and `pnpm db:studio` delegate to `@workspace/database`.
- The root `turbo.json` owns shared task shape. App-specific Turbo task inputs belong in package-level configs that extend the root config.
- `apps/web/turbo.json` extends the root Turbo config and owns `web#build` environment-variable classification. Keep web deployment env there instead of widening root task env lists for the whole monorepo.
- Turbo should stay in strict env mode for production builds. Do not switch to `envMode: "loose"` to work around missing deployment env; classify build-output variables with `env` and runtime-only variables with `passThroughEnv`.
- `pnpm --filter web dev` runs the web app on port `3000`. If that port is occupied, stop the stale process before starting another dev server.
- For database package work, keep `DATABASE_URL` in `packages/database/.env.local`, root `.env.local`, `packages/database/.env`, or root `.env`; `packages/database/drizzle.config.ts` loads those files in that precedence order.
- Schema sync policy lives in [Database Workflow](./database-workflow.md). Use the CLI commands above for synchronization and escalate to the user before any non-CLI workaround.

## Update Triggers

- Update this file when workspace packages are added, removed, or renamed.
- Update this file when root scripts, Turbo tasks, or package ownership boundaries change.
- Update this file when package-level Turbo configs are added, removed, or change task ownership.
