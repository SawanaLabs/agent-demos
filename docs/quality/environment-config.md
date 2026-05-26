---
title: Environment Config
description: Durable rules for environment-variable contracts, env modules, and direct process.env usage.
updateAt: 2026-05-24
---

# Environment Config

## Scope

- Covers repository environment-variable contracts exposed through `keys.ts` and `env.ts`.
- Covers the Biome rule that warns on direct `process.env` usage outside approved config entrypoints.
- Covers the default shape for server-side secret and runtime configuration modules in `apps/web` and workspace packages.

## Current Subdomain Docs

- Use a `keys.ts` plus `env.ts` pair for environment-variable management.
- `keys.ts` is the only place allowed to read `process.env` directly. It owns `createEnv(...)`, `zod` validation, defaults, and `runtimeEnv`.
- `env.ts` owns the public interface for the rest of the codebase. It exports setup-state helpers, config readers, and explicit error helpers that feature code can call.
- Feature code should import `env.ts` or `@/env` and pass those typed objects through public function parameters. Route handlers, runtime modules, model helpers, and chat helpers should not read `process.env` directly.
- Keep package-level contracts strict when the package cannot operate without the variable, and keep app-level contracts soft when the UI can render in a setup-required state.
- `apps/web/env.ts` is the app-level aggregation point for shared optional environment contracts that multiple features consume.
- Shared optional infrastructure contracts such as Redis, Vercel Sandbox, and Vercel Blob should each live in `apps/web/features/shared/<capability>/server/keys.ts`, then flow into `apps/web/env.ts` for app-level aggregation.
- Biome `style.noProcessEnv` is enabled at warning level across the repository. The only standing override is for `**/env.ts` and `**/keys.ts` files, where direct `process.env` reads are part of the contract layer by design.
- Existing warnings in tests or untouched parallel work are acceptable during migration, but new production code should follow the contract-layer pattern immediately.

## Update Triggers

- Update this file when a new shared environment contract appears.
- Update this file when `biome.jsonc` changes the `noProcessEnv` rule level or override shape.
- Update this file when the repository adopts a new env validation library or app-level aggregation strategy.
