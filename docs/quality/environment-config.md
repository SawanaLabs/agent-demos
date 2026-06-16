---
title: Environment Config
description: Durable rules for environment-variable contracts, env modules, and direct process.env usage.
updateAt: 2026-06-02
---

# Environment Config

## Scope

- Covers repository environment-variable contracts exposed through `keys.ts` and `env.ts`.
- Covers the Biome rule that warns on direct `process.env` usage outside approved config entrypoints.
- Covers the default shape for server-side secret and runtime configuration modules in `apps/web` and workspace packages.

## Current Subdomain Docs

- Use a `keys.ts` plus `env.ts` pair for TypeScript environment-variable management. Node ESM lifecycle scripts that run directly with `node` may use a sibling `keys.mjs` contract module when they cannot import TypeScript at runtime.
- `keys.ts` is the only place allowed to read `process.env` directly. It owns `createEnv(...)`, `zod` validation, defaults, and `runtimeEnv`.
- `env.ts` owns the public interface for the rest of the codebase. It exports setup-state helpers, config readers, and explicit error helpers that feature code can call.
- Feature code should import `env.ts` or `@/env` and pass those typed objects through public function parameters. Route handlers, runtime modules, model helpers, and chat helpers should not read `process.env` directly.
- Keep package-level contracts strict when the package cannot operate without the variable, and keep app-level contracts soft when the UI can render in a setup-required state.
- `apps/web/env.ts` is the app-level aggregation point for shared optional environment contracts that multiple features consume.
- Shared optional infrastructure contracts such as Redis, Vercel Sandbox, and Vercel Blob should each live in `apps/web/features/shared/<capability>/server/keys.ts`, then flow into `apps/web/env.ts` for app-level aggregation.
- `VERCEL_SANDBOX_INTEGRATION=1` is a test-only opt-in key owned by the shared Vercel Sandbox environment contract. Integration tests that create real Vercel Sandbox resources must require it before provider setup is attempted.
- Vercel Sandbox authentication should prefer `VERCEL_OIDC_TOKEN`. Local provider-backed tests get this token through `vercel link` plus `vercel env pull`; Vercel production uses Vercel-managed OIDC automatically. The `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, and `VERCEL_PROJECT_ID` trio is only for external CI/CD or non-Vercel hosting where OIDC is unavailable. See [Vercel Sandbox authentication](https://vercel.com/docs/vercel-sandbox/concepts/authentication) and [Vercel OIDC federation](https://vercel.com/docs/oidc).
- Do not treat a locally pulled `VERCEL_OIDC_TOKEN` as a permanent production secret. Local development tokens expire and should be refreshed with `vercel env pull`; production on Vercel should rely on the platform-managed OIDC context.
- Shared environment modules that must ship through the shadcn registry should split portable runtime contracts from environment adapters. The portable contract accepts an env record or explicit config; the app adapter wires `apps/web/env.ts`; the registry adapter wires consumer `process.env`.
- The AI Gateway shared contract lives at `apps/web/features/shared/ai-gateway/server/contract.ts`. It owns Node version checks, Gateway default resolution, setup-state construction, and `createGateway` wiring. App demo `server/env.ts` files should import that contract and get env data through feature-local `server/env-source.ts` adapters.
- Registry AI Gateway demos should copy the same portable contract into `registry/<demo-slug>/lib/ai-gateway/contract.ts`. Their demo-owned `env-source.ts` files may read `process.env`; their demo-owned `env.ts` files should import `@/lib/ai-gateway/contract` and keep demo-specific defaults or extra setup issues local.
- Registry source under `registry/*` is consumer-installed code. It may read `process.env` directly from an `env.ts` or `env-source.ts` adapter because that installed code does not have this repo's `@/env` aggregation layer.
- Do not mirror `@t3-oss/env-nextjs` into ordinary demo registry items just to preserve app preview validation. Use a small registry env adapter plus `envVars` unless the registry item explicitly installs a broader env-management architecture.
- Biome `style.noProcessEnv` is enabled at warning level across the repository. The only standing override is for `**/env.ts` and `**/keys.ts` files, where direct `process.env` reads are part of the contract layer by design.
- Existing warnings in tests or untouched parallel work are acceptable during migration, but new production code should follow the contract-layer pattern immediately.
- `apps/web/turbo.json` owns the web app's Turborepo deployment env classification. Keep `env` for variables that affect `next build` output or demo setup/readiness rendering, and keep `passThroughEnv` for runtime-only secrets that must be available to server routes without entering the build cache hash.
- AI Gateway, database, Redis, Blob, LangGraph, and native OpenAI model selection variables are build-output inputs for `web#build` because demo pages can render setup/readiness state from them.
- Cron and Vercel Sandbox credential variables are runtime-only pass-through inputs for `web#build`. Do not put `VERCEL_OIDC_TOKEN` or the `VERCEL_TOKEN` credential trio into build hash inputs unless the build output intentionally depends on those values.
- `VERCEL_ENV` and `VERCEL_TARGET_ENV` are runtime-only pass-through inputs for `web#build`. The development observability harness reads them at runtime to fail closed outside local development without making deployment context part of the build cache key.
- Demo pages under `apps/web/app/demos/*/page.tsx` should export `dynamic = "force-dynamic"` so setup/readiness state reflects the current deployment runtime instead of a static build snapshot. `apps/web/app/demos/page-rendering-contract.test.ts` enforces this for all demo workspaces.
- When adding a new web environment contract, update the matching `keys.ts`, `apps/web/env.ts`, `apps/web/turbo.json`, and the narrow contract tests in the same change.

## Update Triggers

- Update this file when a new shared environment contract appears.
- Update this file when `biome.jsonc` changes the `noProcessEnv` rule level or override shape.
- Update this file when the repository adopts a new env validation library or app-level aggregation strategy.
- Update this file when `apps/web/turbo.json` changes env or pass-through classification.
