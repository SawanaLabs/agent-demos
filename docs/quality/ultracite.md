---
title: Ultracite
description: Durable conventions for the repository's Ultracite and Biome quality gate.
updateAt: 2026-06-08
---

# Ultracite

## Scope

- Covers `biome.jsonc`, root quality scripts, package quality scripts, and type-aware linting constraints.
- Covers known cases where Biome's resolver differs from this repo's runtime import contracts.

## Current Subdomain Docs

- Ultracite is the primary code quality checker for this repository.
- Run quality commands from the root:
  - `pnpm lint` or `pnpm check` for `ultracite check`.
  - `pnpm format` or `pnpm fix` for `ultracite fix`.
  - `pnpm typecheck` for TypeScript contract verification.
  - `pnpm exec ultracite doctor` when checking the tool installation itself.
- Package-level `lint` and `format` scripts in `apps/web`, `packages/ui`, and `packages/database` delegate back to the root so they use the same `biome.jsonc`.
- Type-aware Ultracite requires `strictNullChecks` to stay enabled in TypeScript configs.
- `correctness.useImportExtensions` is disabled in `biome.jsonc`. Workspace export maps and path aliases expose package paths such as `@workspace/ui/postcss.config` without file extensions.
- Root Ultracite excludes `registry/**`. Those files are generated shadcn registry payloads for consumer apps, so their `@/components` and `@/lib` imports target the consumer project shape rather than this monorepo's `apps/web` aliases.
- Test files disable a small set of low-signal runtime/style rules: direct env mutation, top-level regex extraction, async helper wrappers, no-op mocks, and `forEach` callback-return checks.
- Demo feature files disable a small set of low-signal Ultracite rules that fight the reference-app surface: async facade methods, local parsing regexes, React fire-and-forget handlers, index keys in static presentation rows, and voice media captions.
- Large interactive demo workspaces keep narrow complexity overrides while they are still feature-dense reference surfaces.
- `apps/web/features/mcp-agent/server/project-*.ts` keeps a narrow barrel-file override because those files are compatibility re-export shims over the shared Project Docs MCP implementation.
- `apps/web/features/openai-agents-sdk-demo/server/**/*.ts` keeps narrow overrides for Agents SDK extension points where `process.env` injection defaults, `void`, nested SDK-result branching, and `any`-typed third-party seams are part of the integration boundary.
- Biome's built-in Drizzle domain is enabled. The Drizzle nursery rules `noDrizzleDeleteWithoutWhere` and `noDrizzleUpdateWithoutWhere` are elevated to errors for `database` and `db` instances to catch accidental full-table writes.
- Biome `style.noProcessEnv` is enabled at warning level. Treat direct `process.env` reads as migration debt unless the file itself is a `keys.ts` or `env.ts` contract module.
- Biome's nursery `noExcessiveLinesPerFile` rule is enabled as an error for `apps/web/**/*.{ts,tsx}` with `maxLines: 500` and `skipBlankLines: true`. Treat a hit as an agent-readability signal: split feature entrypoints, hooks, server contracts, fixtures, or presentation helpers when the file starts mixing responsibilities.
- Biome's official `complexity.noExcessiveLinesPerFunction` rule is enabled as an error for `apps/web/features/**/*.{ts,tsx}` with `maxLines: 150` and `skipBlankLines: true`. Treat a hit as a maintainability signal: keep workspace/page components thin, move state and actions into hooks, and move pure derivation, server contracts, or protocol helpers into focused modules.
- Keep targeted Biome overrides narrow. Current overrides cover `keys.ts` and `env.ts` environment-contract entrypoints, config-file re-export patterns, known false positives for Next font virtual exports and `eslint-plugin-only-warn`, imported AI Elements component sources, and the Drizzle schema entrypoint shape in `packages/database/src/index.ts`.
- Root `.eslintrc.js` and `.prettierrc` are not part of the current quality gate. Avoid reintroducing parallel root lint or format systems without a specific reason.

## Update Triggers

- Update this file when Ultracite, Biome, TypeScript strictness, or quality scripts change.
- Update this file when a new resolver exception is confirmed and captured in `biome.jsonc`.
