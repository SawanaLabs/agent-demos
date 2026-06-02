---
title: Quality Knowledge Protocol
description: Domain-level language, reading path, and boundary principles for quality tooling and verification.
updateAt: 2026-06-02
---

# Quality Knowledge Protocol

## Reading Path

- Read this file before changing linting, formatting, type checking, tests, CI quality gates, environment-variable policy, or quality-related root/package scripts.
- For environment-variable contracts, read [Environment Config](./environment-config.md) after this file.
- For integration tests, provider-backed tests, and Vercel Sandbox verification, read [Integration Testing](./integration-testing.md) after this file.
- For Ultracite, Biome, formatter, lint, and type-aware quality rules, read [Ultracite](./ultracite.md) after this file.

## Domain Language

- **Root quality gate**: The root-level Ultracite and TypeScript workflow exposed through `pnpm lint`, `pnpm check`, `pnpm format`, `pnpm fix`, and `pnpm typecheck`.
- **Environment contract module**: A `keys.ts` or `env.ts` module that owns direct environment access, validation, or public configuration helpers.
- **Test layering**: Unit tests are the primary contract layer; integration tests and E2E checks add evidence only where unit tests cannot cover provider connectivity, runtime boundaries, or user-facing flows.
- **Integration test harness**: The opt-in test configuration and helper layer used for tests that need real runtime providers or cross-module behavior.
- **Quality override**: A narrow rule exception in `biome.jsonc` or package scripts that exists to preserve a known repository contract.

## Boundary Principles

- Keep the root quality gate authoritative. Package scripts should delegate to root quality commands when they need shared Ultracite or Biome configuration.
- Keep direct `process.env` access inside `keys.ts` and `env.ts` contract modules. Feature code should consume typed helpers or passed configuration.
- Prefer explicit failures for broken quality contracts. Avoid fallback behavior that hides missing configuration, invalid imports, or unsafe database operations.
- Keep provider-backed integration tests explicit and cost-aware. They should not run in the default quality gate until runtime, cost, and flake rate are proven acceptable.
- Keep quality overrides narrow and documented in the matching subdomain doc when they represent durable repository behavior.
- Add tests around core contract surfaces. Do not expand broad test volume just to cover implementation churn.
- Prefer unit or narrow module tests when they can fully verify the behavior. Use integration tests and E2E checks as complementary layers, not duplicate coverage for already-proven branches.

## Update Triggers

- Update this file when the repository changes its quality-gate ownership, environment-contract policy, or test-scope policy.
- Update [Environment Config](./environment-config.md) when env validation, app aggregation, or direct `process.env` rules change.
- Update [Integration Testing](./integration-testing.md) when integration-test layering, provider-backed test policy, or Vercel Sandbox verification changes.
- Update [Ultracite](./ultracite.md) when Ultracite, Biome, TypeScript strictness, quality scripts, or quality overrides change.
