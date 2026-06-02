---
title: Quality Knowledge Protocol
description: Domain-level language, reading path, and boundary principles for quality tooling and verification.
updateAt: 2026-06-02
---

# Quality Knowledge Protocol

## Reading Path

- Read this file before changing linting, formatting, type checking, tests, CI quality gates, environment-variable policy, or quality-related root/package scripts.
- Use the completion layers below when deciding what an agent should run before finishing a code task.
- For environment-variable contracts, read [Environment Config](./environment-config.md) after this file.
- For integration tests, provider-backed tests, and Vercel Sandbox verification, read [Integration Testing](./integration-testing.md) after this file.
- For Ultracite, Biome, formatter, lint, and type-aware quality rules, read [Ultracite](./ultracite.md) after this file.

## Domain Language

- **Root quality gate**: The root-level Ultracite and TypeScript workflow exposed through `pnpm lint`, `pnpm check`, `pnpm format`, `pnpm fix`, and `pnpm typecheck`.
- **Completion checks**: The end-of-task evidence selected by risk: root quality gate, focused tests, integration tests, and browser QA or E2E.
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

## Completion Check Layers

- **Basic quality check**: After code changes, run `pnpm check` or `pnpm lint`, plus `pnpm typecheck`. These are the current root gate commands; do not invent separate ESLint or Biome commands unless package scripts are added for them.
- **Focused unit or contract tests**: Run the related Vitest test files for modules touched by the change. If a core behavior changes and no useful test exists, add one small contract test before widening coverage.
- **Integration tests**: Propose or run integration tests when the change touches provider connectivity, sandbox lifecycle, database behavior, runtime boundaries, or cross-module contracts. Keep provider-backed suites explicit and opt-in.
- **Browser QA or E2E**: Run at least one user-flow check when a change affects visible UI, streaming behavior, route navigation, or a complete business path.
- **Reporting**: The final response should list the checks run, skipped checks with concrete reasons, and any remaining risk. If a check fails because of likely network behavior, retry once before reporting it as a blocker.

## Update Triggers

- Update this file when the repository changes its quality-gate ownership, environment-contract policy, or test-scope policy.
- Update [Environment Config](./environment-config.md) when env validation, app aggregation, or direct `process.env` rules change.
- Update [Integration Testing](./integration-testing.md) when integration-test layering, provider-backed test policy, or Vercel Sandbox verification changes.
- Update [Ultracite](./ultracite.md) when Ultracite, Biome, TypeScript strictness, quality scripts, or quality overrides change.
