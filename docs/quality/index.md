---
title: Quality
description: Navigation for quality tooling and verification workflow knowledge.
updateAt: 2026-06-03
---

# Quality

Use this domain when changing linting, formatting, type checking, tests, or CI quality gates.

## Domain Protocol

- Start with [Quality Knowledge Protocol](./DOCS.md) for quality-wide language, reading path, and boundary principles.
- For environment-variable contracts, read [Quality Knowledge Protocol](./DOCS.md), then [Environment Config](./environment-config.md).
- For integration tests and provider-backed verification, read [Quality Knowledge Protocol](./DOCS.md), then [Integration Testing](./integration-testing.md).
- For focused abuse, cost, privacy, and code-integrity review, read [Quality Knowledge Protocol](./DOCS.md), then [Resource Abuse and Privacy Review](./resource-abuse-privacy-review.md).
- For the current repo-grounded abuse and privacy findings, read [Resource Abuse and Privacy Audit - 2026-06-03](./resource-abuse-privacy-audit-2026-06-03.md).
- For linting, formatting, type checking, and Biome rules, read [Quality Knowledge Protocol](./DOCS.md), then [Ultracite](./ultracite.md).

## Subdomains

- [Environment Config](./environment-config.md): `keys.ts` and `env.ts` contracts, direct `process.env` policy, and migration rules.
- [Integration Testing](./integration-testing.md): Default test layering, production demo smoke checks, Vercel Sandbox integration tests, cost controls, and release-gate policy.
- [Resource Abuse and Privacy Audit - 2026-06-03](./resource-abuse-privacy-audit-2026-06-03.md): Repo-grounded findings for provider spend, Vercel resources, visitor-private data, retention, and code integrity.
- [Resource Abuse and Privacy Review](./resource-abuse-privacy-review.md): Focused review boundary for protecting provider spend, hosted resources, private demo data, and project code integrity.
- [Ultracite](./ultracite.md): Root Ultracite/Biome setup, command usage, and known resolver boundaries.
