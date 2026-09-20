---
title: Quality
description: Navigation for quality tooling and verification workflow knowledge.
updateAt: 2026-06-04
---

# Quality

Use this domain when changing linting, formatting, type checking, tests, or CI quality gates.

## Domain Protocol

- Start with [Quality Knowledge Protocol](./DOCS.md) for quality-wide language, reading path, and boundary principles.
- For environment-variable contracts, read [Quality Knowledge Protocol](./DOCS.md), then [Environment Config](./environment-config.md).
- For integration tests and provider-backed verification, read [Quality Knowledge Protocol](./DOCS.md), then [Integration Testing](./integration-testing.md).
- For focused abuse, cost, privacy, and code-integrity review, read [Quality Knowledge Protocol](./DOCS.md), then [Resource Abuse and Privacy Review](./resource-abuse-privacy-review.md).
- For linting, formatting, type checking, and Biome rules, read [Quality Knowledge Protocol](./DOCS.md), then [Ultracite](./ultracite.md).

## Subdomains

- [Environment Config](./environment-config.md): `keys.ts` and `env.ts` contracts, direct `process.env` policy, and migration rules.
- [Integration Testing](./integration-testing.md): Default test layering, production demo smoke checks, Vercel Sandbox integration tests, cost controls, and release-gate policy.
- [Resource Abuse and Privacy Review](./resource-abuse-privacy-review.md): Focused review boundary for protecting provider spend, hosted resources, private demo data, and project code integrity.
- [Ultracite](./ultracite.md): Root Ultracite/Biome setup, command usage, and known resolver boundaries.

<!-- BEGIN:docs-generated-catalog -->
| File | Title | Description | Updated |
| --- | --- | --- | --- |
| ./DOCS.md | Quality Knowledge Protocol | Domain-level language, reading path, and boundary principles for quality tooling and verification. | 2026-06-04 |
| ./environment-config.md | Environment Config | Durable rules for environment-variable contracts, env modules, and direct process.env usage. | 2026-08-17 |
| ./integration-testing.md | Integration Testing | General conventions for repository integration tests, including Vercel Sandbox-backed contract tests. | 2026-06-12 |
| ./resource-abuse-privacy-review.md | Resource Abuse and Privacy Review | Focused review boundary for protecting provider spend, hosted resources, private demo data, and project code integrity. | 2026-06-04 |
| ./ultracite.md | Ultracite | Durable conventions for the repository's Ultracite and Biome quality gate. | 2026-06-08 |
<!-- END:docs-generated-catalog -->
