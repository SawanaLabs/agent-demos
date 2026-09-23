---
title: Feedback Agent
description: Native shadcn capture UI, upstream capture logic, private evidence storage, and copy boundaries for Feedback Agent.
updateAt: 2026-09-23
---

# Feedback Agent

## Scope

- Covers `apps/web/features/feedback-agent`, `/demos/feedback-agent`, and `/api/demos/feedback-agent/[[...path]]`.
- Keep setup, file map, license provenance, and migration instructions in the feature [README](../../apps/web/features/feedback-agent/README.md).

## Current Rules

- Keep the Feedback launcher docked to the right edge at mid-height, matching the original entry position. Rotate the vertical label so the text baseline faces the outside edge. Restyling the controls must not move the entry point.
- Build all capture controls with shared shadcn primitives and theme tokens. Keep React UI in `ui/`, capture/submission adapters in `client/`, and attributed MIT capture/privacy code in `upstream/`. Do not mount the upstream Shadow DOM widget or override its stylesheet.
- Preserve upstream attribution and license. The native collector attaches its image at session creation; retain the separate screenshot endpoint for original SDK compatibility.
- Selection dims the page with the shared overlay token and leaves the hovered/focused element clear. Keep the overlay pointer-transparent.
- Offer Primary (default), Black, Green, and Yellow beside Draw. Store color per stroke and preserve it in both the preview and baked screenshot; changing pens must not recolor existing strokes.
- Show a privacy-masked preview before submission. Draw coordinates use the captured viewport; screenshot baking preserves the original scroll anchor. Capture errors must be visible and require retake or explicit screenshot opt-out.
- The native UI does not record replay or console logs. Keep existing optional replay evidence readable. An unchanged submission retry reuses its idempotency identity.
- Feedback Agent is an independent application slice. The portable `FeedbackCollector` requires an `onSubmit` callback and has no default API, cookie, Redis, or AI dependency. Keep evidence preparation separate from `client/submit.ts`, which wires this demo to its same-origin Redis inbox. AI analysis uses this app's configured gateway. Upstream attribution identifies MIT code provenance, never a submission destination, affiliation, or service dependency.
- Keep capture usable without an AI key. Save feedback first, then let the user request AI analysis. The runtime implements the submission-only protocol, advertises `ai_clarify_available: false`, and does not impersonate the hosted backend's wider API.
- Keep ownership in `server/owner.ts`. Every Redis record and inbox is visitor-scoped; report IDs, SDK project keys, and the success-link `identity` query parameter never grant access. A copied team collector must introduce its own project and reviewer authorization.
- Drafts expire after one day; finalized feedback after seven days. Updating status or analysis must not extend report retention. Session creation is idempotent, and compare-and-swap protects finalize, abandon, and edit transitions.
- Enforce upload limits before parsing, validate screenshots with Sharp, require the SDK capture policy, and sanitize structured evidence. Keep previous feedback panels blocked from capture with `rr-block`.
- Only Analyze uses the site-owned metered route wrapper. Keep that wrapper outside portable feature code; consumers can substitute their own usage controls.
- AI reads untrusted report evidence and drafts an issue. Do not claim that it inspected source, fixed a bug, or published a ticket. Copy issue is a clipboard operation.
- Keep architecture, storage choices, and provenance in documentation/source links, outside the feedback composer. Redis is required by the full reference inbox, never by the portable collector; a host can use its existing database or ticket API via `onSubmit`. A rejected save keeps the draft and unchanged retries reuse the exact evidence and idempotency key.
- Keep both discovery paths: use the upstream project directly, or copy this feature slice. Do not advertise a registry install command until the slice is actually packaged.

## Validation

- Parser tests exercise capture policy and sanitization. Redis integration tests exercise real separate screenshot upload, idempotent concurrent finalization, visitor isolation, persisted status, and abandonment.
- Browser QA should select a real element, submit with screenshot enabled, open the saved evidence, run real AI analysis, and verify status after reload.

## Update Triggers

- Revisit this document when updating the adapted capture code, changing ownership/retention, adding team routing, enabling synchronous clarification, or adding external ticket delivery.
