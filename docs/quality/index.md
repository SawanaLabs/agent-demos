---
title: Quality
description: Navigation for quality tooling and verification workflow knowledge.
updateAt: 2026-06-02
---

# Quality

Use this domain when changing linting, formatting, type checking, tests, or CI quality gates.

## Domain Protocol

- Start with [Quality Knowledge Protocol](./DOCS.md) for quality-wide language, reading path, and boundary principles.
- For environment-variable contracts, read [Quality Knowledge Protocol](./DOCS.md), then [Environment Config](./environment-config.md).
- For integration tests and provider-backed verification, read [Quality Knowledge Protocol](./DOCS.md), then [Integration Testing](./integration-testing.md).
- For linting, formatting, type checking, and Biome rules, read [Quality Knowledge Protocol](./DOCS.md), then [Ultracite](./ultracite.md).

## Subdomains

- [Environment Config](./environment-config.md): `keys.ts` and `env.ts` contracts, direct `process.env` policy, and migration rules.
- [Integration Testing](./integration-testing.md): Default test layering, production demo smoke checks, Vercel Sandbox integration tests, cost controls, and release-gate policy.
- [Ultracite](./ultracite.md): Root Ultracite/Biome setup, command usage, and known resolver boundaries.
