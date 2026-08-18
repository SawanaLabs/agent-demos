---
title: Telemetry Knowledge Protocol
description: Domain language and hard boundaries for deployed product analytics and runtime error logging.
updateAt: 2026-08-17
---

# Telemetry Knowledge Protocol

## Reading Path

- Read this file before changing deployed analytics, consent, runtime error logging, or host telemetry adapters.
- Read [Production Telemetry](./production-telemetry.md) for the current GA4, Vercel Runtime Logs, privacy, environment, and registry contracts.
- Development-only VictoriaMetrics tooling remains in [Observability](../observability/index.md); it is a separate system.

## Domain Language

- **Product Analytics**: GA4 evidence about which bounded product actions people use and the pseudonymous page/event journey. Automatic pageviews keep GA4's standard URL/referrer fields; repository-owned custom events do not carry failures, prompts, internal IDs, or arbitrary text.
- **Deployed Runtime Error Logging**: One structured `console.error` record at the final failure boundary for provider, tool, storage, runtime, or client-boundary failures. It does not record successful lifecycle events.
- **Host Telemetry Adapter**: An `apps/web` integration owned by the published site. Copyable demo code and generated registry artifacts must remain provider-neutral.
- **Advanced Consent Mode**: GA4 loads with analytics storage denied by default. Denied mode can still send cookieless measurement pings; it is not a zero-request mode.

## Boundary Principles

- Keep Product Analytics and Deployed Runtime Error Logging as separate planes with separate event catalogs and purposes.
- Repository-owned custom event payloads and runtime logs accept only explicit low-cardinality enums and bounded scalars. They never accept or log raw `Error`, message, stack, cause, prompt, user input, URL, query, token, credential, image data, file name, or nested arbitrary object. This restriction does not rewrite GA4's provider-owned automatic pageview payload.
- A telemetry provider must never own the product workflow. Storage, deployment metadata, provider, clock, identifier, or sink failures must not replace the original result or error.
- Keep all provider imports, environment variables, event names, and logger calls out of `registry/**` and `apps/web/public/r/**`.
- Preview analytics is disabled unless a separate Preview GA4 property is explicitly configured. Production must fail fast when its property is missing or invalid.

## Update Triggers

- Update this file when the separation, privacy rules, consent semantics, host ownership, or environment gates change.
- Add concrete event catalogs and acceptance evidence to `production-telemetry.md`, not to the development observability docs.
