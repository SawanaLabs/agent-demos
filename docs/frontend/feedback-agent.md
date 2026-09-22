---
title: Feedback Agent
description: Upstream widget reuse, submission protocol, private evidence storage, and copy boundaries for Feedback Agent.
updateAt: 2026-09-23
---

# Feedback Agent

## Scope

- Covers `apps/web/features/feedback-agent`, `/demos/feedback-agent`, and `/api/demos/feedback-agent/[[...path]]`.
- Keep setup, file map, license provenance, and migration instructions in the feature [README](../../apps/web/features/feedback-agent/README.md).

## Current Rules

- Reuse the MIT Make This Better npm widget directly. Preserve upstream attribution and the copied sanitizer's license. Verify its actual network protocol when upgrading; version 1.30.1 uploads screenshots separately from session creation.
- Keep capture usable without an AI key. Save feedback first, then let the user request AI analysis. The runtime implements the submission-only protocol, advertises `ai_clarify_available: false`, and does not impersonate the hosted backend's wider API.
- Keep ownership in `server/owner.ts`. Every Redis record and inbox is visitor-scoped; report IDs, SDK project keys, and the success-link `identity` query parameter never grant access. A copied team collector must introduce its own project and reviewer authorization.
- Drafts expire after one day; finalized feedback after seven days. Updating status or analysis must not extend report retention. Session creation is idempotent, and compare-and-swap protects finalize, abandon, and edit transitions.
- Enforce upload limits before parsing, validate screenshots with Sharp, require the SDK capture policy, and sanitize structured evidence. Keep previous feedback panels blocked from capture with `rr-block`.
- Only Analyze uses the site-owned metered route wrapper. Keep that wrapper outside portable feature code; consumers can substitute their own usage controls.
- AI reads untrusted report evidence and drafts an issue. Do not claim that it inspected source, fixed a bug, or published a ticket. Copy issue is a clipboard operation.
- Keep both visible paths: use the upstream project directly, or copy this feature slice. Do not advertise a registry install command until the slice is actually packaged.

## Validation

- Parser tests exercise capture policy and sanitization. Redis integration tests exercise real separate screenshot upload, idempotent concurrent finalization, visitor isolation, persisted status, and abandonment.
- Browser QA should select a real element, submit with screenshot enabled, open the saved evidence, run real AI analysis, and verify status after reload.

## Update Triggers

- Revisit this document when upgrading the widget, changing ownership/retention, adding team routing, enabling synchronous clarification, or adding external ticket delivery.
