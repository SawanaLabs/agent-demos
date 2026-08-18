---
title: Production Telemetry
description: GA4 product analytics and Vercel Runtime Logs contracts for the published Agent Demos site.
updateAt: 2026-08-17
---

# Production Telemetry

## Two Independent Planes

| Plane | Purpose | Transport | Repository-owned payload must not contain |
| --- | --- | --- | --- |
| Product Analytics | Understand feature use and pseudonymous page/event journeys | `@next/third-parties/google` and GA4 | custom `demo_action` fields with failures, prompts, internal IDs, URLs, or arbitrary text; automatic pageviews keep GA4's standard URL/referrer fields |
| Deployed Runtime Error Logging | Diagnose final provider/tool/storage/runtime/client-boundary failures | one-line JSON through `console.error` and Vercel Runtime Logs | raw errors, message, stack, cause, request bodies, secrets, user content |

Do not send success/failure outcomes to GA4 and do not write ordinary success lifecycle logs.

## Environment Contract

- Local development, tests, and non-Vercel builds: analytics disabled, even if a non-Vercel environment happens to define `VERCEL_ENV`.
- Vercel Preview: disabled by default. Defining `NEXT_PUBLIC_GA_PREVIEW_MEASUREMENT_ID` explicitly enables a test property only when the canonical Production ID is also visible for a fail-closed inequality check.
- Vercel Production: `NEXT_PUBLIC_GA_MEASUREMENT_ID` is required and must match a GA4 `G-*` Measurement ID; missing or invalid configuration fails fast.
- Never reuse the Production property for Preview validation. Preview test mode fails when the Production reference is absent, malformed, or equal to the Preview ID.
- Runtime error records include bounded `deployment_environment`, optional Git ref, and hostname only. URL paths and queries are discarded.

## Consent Contract

`SiteAnalyticsRoot` installs the consent-default script with `beforeInteractive` before rendering `<GoogleAnalytics />`:

- `analytics_storage` defaults to `denied`.
- `ad_storage`, `ad_user_data`, and `ad_personalization` always stay `denied`.
- The versioned local choice is only `granted` or `denied`.
- The privacy control remains reopenable so a visitor can change the choice.
- Provider or local-storage failure is best effort and must not affect the app.
- Advanced Consent Mode can send cookieless measurement pings while denied. The UI states this explicitly.

`<GoogleAnalytics />` owns the default GA4 pageview integration. Keep provider-standard page URL/referrer fields as approved for this site; do not add a repository-owned route watcher or manual `page_view`. If SPA history-change pageviews are needed, enable and verify the GA4 web stream's Enhanced Measurement setting during Preview acceptance instead of adding application code.

## Product Event Contract

The bounded host event is:

```text
demo_action {
  demo_slug,
  action,
  source?,
  has_reference_image?
}
```

The initial Image Workflow vocabulary is `send_message`, `run_workflow`, and `modify_workflow`. This foundation defines the catalog and best-effort browser adapter but does not yet connect concrete demo interactions; that rollout belongs to the dependent implementation tickets.

Do not add default graph initialization, drag/pan noise, prompts, image URLs, visitor IDs, dynamic labels, or arbitrary metadata.

## Runtime Error Contract

`site-runtime-logging` owns a finite catalog and a server-only logger. A record contains only:

- stable event, service, level, generated `error_id`, and UTC timestamp;
- bounded deployment environment/ref/host;
- explicit low-cardinality context such as demo slug, operation, failure category, source, retryability, duration, or client error kind.

The logger API does not accept an `Error`. Unknown fields and values are dropped. Identifier, clock, deployment, serialization, or sink failures are swallowed so logging cannot replace the product failure.

`/api/client-errors` accepts only a bounded error kind and source. The browser never sends a digest, message, stack, path, URL, query, or user-agent. The route requires same-origin browser metadata and JSON, caps the body at 512 bytes while streaming, and rejects unknown fields before mapping the report into `client.runtime_failed`.

## Registry Isolation

The production telemetry provider belongs only to the published-site host. `scripts/registry-sync/host-telemetry-isolation.mjs` scans both `registry/**` and `apps/web/public/r/**` and rejects provider packages/calls, GA environment names, host feature paths, and logger event identifiers. Run:

```bash
pnpm registry:telemetry:check
pnpm test:unit
pnpm registry:check
```

The scanner reads every non-binary file regardless of extension, rejects path-only host markers and symlinks, and runs before and after registry build/validation plus after sync writes.

A failure in unrelated registry projection checks must be diagnosed separately; do not repair unrelated demo projection drift as part of telemetry work.

## Preview Acceptance After Merge

Sawana owns Preview acceptance and merge. In a Preview deployment configured with a separate GA4 test property:

1. Confirm the default consent command executes before the GA tag and storage starts denied.
2. Confirm the privacy choice persists and can be reopened.
3. Confirm a denied choice does not create analytics cookies; cookieless requests remain expected under Advanced Consent Mode.
4. Navigate representative routes and confirm expected pageviews arrive once with provider-standard page URL/referrer fields; verify the GA4 web stream's browser-history Enhanced Measurement setting when validating client-side transitions.
5. Confirm DebugView receives only bounded `demo_action` fields after the dependent demo-instrumentation ticket lands.
6. Trigger one controlled client-boundary failure and confirm one Vercel Runtime Logs JSON record with Preview/ref/host metadata and no sentinel prompt, URL query, token, credential, message, or stack.
7. Install or inspect a generated registry artifact and confirm no host telemetry package, environment name, event, or logger is present.

## Reference Implementation

The design adapts analytics consent and structured logging patterns from Pikkai commit `0ad26fbcada696664d815784c85338b7ace3c813`, while tightening the client-error boundary and preserving this repository's host-versus-registry architecture.
