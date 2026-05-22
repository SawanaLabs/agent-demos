---
title: Ultracite
description: Durable conventions for the repository's Ultracite and Biome quality gate.
updateAt: 2026-05-22
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
- Keep targeted Biome overrides narrow. Current overrides cover config-file re-export patterns, known false positives for Next font virtual exports and `eslint-plugin-only-warn`, imported AI Elements component sources, and the Drizzle schema entrypoint shape in `packages/database/src/index.ts`.
- Root `.eslintrc.js` and `.prettierrc` are not part of the current quality gate. Avoid reintroducing parallel root lint or format systems without a specific reason.

## Update Triggers

- Update this file when Ultracite, Biome, TypeScript strictness, or quality scripts change.
- Update this file when a new resolver exception is confirmed and captured in `biome.jsonc`.
