---
title: Ultracite
description: Durable conventions for the repository's Ultracite and Biome quality gate.
updateAt: 2026-05-24
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
- Biome's built-in Drizzle domain is enabled. The Drizzle nursery rules `noDrizzleDeleteWithoutWhere` and `noDrizzleUpdateWithoutWhere` are elevated to errors for `database` and `db` instances to catch accidental full-table writes.
- Biome's official `complexity.noExcessiveLinesPerFunction` rule is enabled only for `apps/web/features/**/*.tsx` with `maxLines: 150` and `skipBlankLines: true`. Treat a hit as a React maintainability signal: keep the workspace/page component thin, move state and actions into hooks, and move pure derivation into model/helper modules.
- Keep targeted Biome overrides narrow. Current overrides cover config-file re-export patterns, known false positives for Next font virtual exports and `eslint-plugin-only-warn`, imported AI Elements component sources, and the Drizzle schema entrypoint shape in `packages/database/src/index.ts`.
- Root `.eslintrc.js` and `.prettierrc` are not part of the current quality gate. Avoid reintroducing parallel root lint or format systems without a specific reason.

## Update Triggers

- Update this file when Ultracite, Biome, TypeScript strictness, or quality scripts change.
- Update this file when a new resolver exception is confirmed and captured in `biome.jsonc`.
