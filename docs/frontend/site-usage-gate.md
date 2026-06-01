---
title: Site Usage Gate
description: Product-language boundary for the published demo website's visitor usage limits and invitation-code upgrades.
updateAt: 2026-06-01
---

# Site Usage Gate

## Scope

- Covers the site-level usage gate for the published demo website.
- Covers the product language for visitor-scoped metering, default trial limits, and invitation-code upgrades.
- Covers the limit dialog and support-waitlist UI shown after a visitor reaches the active allowance.
- Covers the boundary that keeps site usage gating out of shadcn registry distribution.

## Domain Language

- **Site Usage Gate**: The published website's lightweight control point that limits model-backed demo usage for a **Site Visitor Owner**.
  _Avoid_: Billing system, authentication system, registry feature

- **Metered Agent Turn**: A user-initiated action that asks an **Agent Demo** to generate or regenerate model-backed output and consumes one site-level usage unit.
  _Avoid_: Token, API call, tool step, raw message row

- **Daily Trial Allowance**: The default site-level allowance granted to a **Site Visitor Owner** for one UTC calendar day.
  _Avoid_: Subscription quota, billing period, rolling window

- **Usage Access Code**: The internal domain name for an operator-provided proof string that upgrades a **Site Visitor Owner** from the default allowance to a configured usage policy. Visitor-facing UI calls it "邀请码".
  _Avoid_: One-time top-up, marketing invite, password

- **Usage Policy**: The configured recurring allowance attached to a redeemed **Usage Access Code**, such as 100 **Metered Agent Turns** every 5 hours.
  _Avoid_: Paid tier, hard-coded plan, temporary bonus pack

- **Usage Event**: The durable record that one **Site Visitor Owner** successfully consumed one **Metered Agent Turn**.
  _Avoid_: Cached counter, chat message, billing invoice

- **Published-Site Host Augmentation**: Site-owned route or UI wiring that applies only to this published demo website and stays outside each **Agent Demo** **Copy Boundary**.
  _Avoid_: Demo runtime dependency, registry item feature, global middleware

- **Usage Limit Dialog**: A shadcn Dialog shown only after the **Site Usage Gate** rejects a **Metered Agent Turn** because the active allowance is exhausted.
  _Avoid_: Always-visible upgrade prompt, demo-local modal, paywall

- **Support Waitlist Entry**: Visitor-submitted waitlist entry from the **Usage Limit Dialog** that records whether the visitor would consider paying for more access, optionally with a message.
  _Avoid_: Generic feedback, payment, subscription, usage event, invite-code redemption

## Current Subdomain Docs

- The first **Site Usage Gate** version is for this published demo website only. It must stay outside `registry/*` and any **Agent Demo** **Copy Boundary**.
- **Site Usage Gate** implementation should live under `apps/web/features/site-usage-gate/*` as a **Published-Site Host Augmentation**.
- `apps/web/app/api/demos/*` route entries may import **Site Usage Gate** server helpers to wrap model-backed demo requests for the published website.
- **Agent Demo** feature slices under `apps/web/features/<demo-slug>/` must not import **Site Usage Gate** modules.
- Registry source files under `registry/*` must not import **Site Usage Gate** modules or include invite-code UI.
- Demo runtime handlers should remain usable without the **Site Usage Gate** so registry copies can call the same demo behavior directly.
- The **Usage Limit Dialog** should live in app-shell or `apps/web/features/site-usage-gate/ui` code. Do not embed invite-code redemption UI inside individual demo workspace components or demo chat hooks.
- The **Usage Limit Dialog** should open only after a structured limit response from the **Site Usage Gate**. It should not appear preemptively while the visitor still has allowance.
- The first dialog view should tell the visitor the active allowance is exhausted and show the reset time converted to the visitor's local time zone.
- The reset time should come from the server response, preferably as an ISO timestamp. The client may format it with the browser locale, but should not recompute the active usage window.
- The first dialog view's primary action should be a support-waitlist action labeled "Join waitlist", with invite-code redemption kept as the secondary path. The dismissal action should use a short English label such as "Maybe later".
- The support-waitlist action opens a secondary view that asks whether the visitor would actually need a paid plan with higher message limits.
- The support-waitlist secondary view should frame the paid access question as a waitlist and feedback collection flow, not as a donation or tip request.
- The support-waitlist secondary view should include an optional message field and one primary submit action labeled "Join waitlist". Do not add a secondary dismissal button inside this secondary view; the dialog close button already provides exit.
- The support-waitlist primary action should submit a **Support Waitlist Entry**.
- Invite-code redemption should be a secondary path opened through a link-style button from the first dialog view.
- The invite-code secondary view should let the visitor enter a **Usage Access Code** to upgrade future allowance. The link, title, and label should use "邀请码" for visitors, while buttons can use short English action labels.
- The invite-code secondary view should explain that a valid code upgrades the quota to 100 messages every 5 hours in the first version.
- Visitor input for invite codes should be normalized to uppercase in the UI, and server-side redemption should treat code matching as case-insensitive.
- Successful **Usage Access Code** redemption should refresh the visitor's effective **Usage Policy** and close or reset the **Usage Limit Dialog**. Invalid codes should show an inline error in the invite-code view.
- **Support Waitlist Entry** should not be stored as a **Usage Event**.
- Do not use global Next.js middleware for the first version. Metering belongs at explicit model-backed demo route entries so non-metered endpoints such as session lookup, upload, records, MCP, and history routes are not accidentally charged.
- A **Site Visitor Owner** starts with a **Daily Trial Allowance** of 10 **Metered Agent Turns** per UTC calendar day.
- A **Metered Agent Turn** is counted when a visitor sends a message, submits an edited message, requests generated suggestions, or resends output.
- A **Metered Agent Turn** counts once even when the **Agent Demo** performs multiple internal model calls or tool steps.
- Invalid request bodies, missing environment setup, and usage-gate rejections should not consume a **Metered Agent Turn**.
- A **Usage Access Code** is an identity proof for a more generous usage class, not a one-time quota pack.
- Redeeming a **Usage Access Code** upgrades the **Site Visitor Owner** so future usage follows the code's configured **Usage Policy**.
- A redeemed **Usage Access Code** should resolve its **Usage Policy** live when usage is checked. Operator changes to the code's configured allowance or enabled state apply to already-upgraded **Site Visitor Owners**.
- The first upgraded **Usage Policy** target is 100 **Metered Agent Turns** every 5 hours.
- The first operator-configured 邀请码 is `SAWANA`, stored and displayed in uppercase, granting the first upgraded **Usage Policy** target.
- **Usage Access Codes** are configurable operator-owned records and may define different upper limits later.
- **Usage Access Codes** may be stored in operator-visible form in the first version. If a code leaks, the operator should disable or replace that code instead of treating it as a high-security secret.
- A **Site Visitor Owner** has at most one active **Usage Access Code** binding. Redeeming a new valid code replaces the previous binding.
- First-version usage accounting persistence should use three Postgres tables: site visitors, access codes, and usage events.
- The site visitor record owns the current active **Usage Access Code** binding for one **Site Visitor Owner**.
- The **Usage Access Code** record owns the operator-configured **Usage Policy**.
- The usage-event record is the source of truth for consumed **Metered Agent Turns**. Future counters or rollups may be added only as derived caches.
- First-version support-waitlist persistence should use a separate Postgres table named `site_usage_waitlist_entries`.
- `site_usage_waitlist_entries` should store the **Site Visitor Owner**, triggering demo slug when available, optional visitor message, willingness-to-pay/support intent value, and creation time.
- `site_usage_waitlist_entries` must not be read by allowance checks, usage-window calculation, or invite-code redemption.
- Future generic feedback should use a separate feedback domain and table, for example `site_feedback_entries`, rather than reusing `site_usage_waitlist_entries`.
- Usage events should be retained for 30 days, aligning the usage gate with the repository's short-lived visitor-data cleanup posture.
- The route wrapper should check active allowance before invoking a demo handler, then create the **Usage Event** only after the handler produces a successful model-backed response. Returned validation and environment errors should not consume usage.
- Once a successful model-backed response has been created and the **Usage Event** has been recorded, provider failures, streaming failures, or tool-loop failures do not roll the usage event back.
- First-version enforcement is best-effort and may allow small concurrent overages. Do not add transaction locks, serializable isolation, or window counter tables until real traffic proves they are needed.

## Implementation Map

- Host-only feature code lives in `apps/web/features/site-usage-gate/*`.
- Database schema lives in `packages/database/src/schemas/site-usage.ts` and is applied through Drizzle migration `packages/database/drizzle/0005_lonely_preak.sql`.
- Persistence uses `site_usage_visitors`, `site_usage_access_codes`, `site_usage_events`, and `site_usage_waitlist_entries`.
- The visitor cookie is `site_visitor_id`. It identifies the **Site Visitor Owner** for this published website and is separate from demo-specific visitor cookies such as persistent-agent and customer-memory cookies.
- `apps/web/features/site-usage-gate/server/route-wrapper.ts` owns the allowance check and post-success usage-event creation contract.
- `apps/web/features/site-usage-gate/server/route-handler.ts` is the database-backed wrapper used by published-site demo API routes.
- Invite-code redemption is handled by `apps/web/app/api/site-usage/access-code/route.ts`; the route name stays `access-code` because **Usage Access Code** is the internal domain term.
- Support-waitlist submission is handled by `apps/web/app/api/site-usage/waitlist/route.ts`.
- Usage-event cleanup is handled by `apps/web/app/api/cron/site-usage-cleanup/route.ts` and scheduled from `vercel.json` with the same UTC cadence as the other visitor-data cleanup jobs.
- The app-shell **Usage Limit Dialog** lives in `apps/web/features/site-usage-gate/ui/site-usage-gate-provider.tsx` and is mounted from `apps/web/app/layout.tsx`.
- The dialog opens by observing structured `SITE_USAGE_LIMIT_EXCEEDED` 429 responses from `/api/demos/*` requests. Demo workspace components and registry source do not import the site-usage UI.
- Generated suggestions are counted through the chat turn that invokes the suggestion-generation tool. The read-only ultra-chatbot suggestions `GET` route is not wrapped.

## Flagged Ambiguities

- "Access code" and "Invite code" read too technical or ambiguous for visitors. Resolved: use "邀请码" in the dialog while keeping **Usage Access Code** as the internal domain term for the operator-configured policy binding.
- The support-waitlist prompt can look like a donation request if it asks whether users want to "support" the app. Resolved: describe it as feedback for deciding whether to launch paid higher limits.
- "100 turns for 5 hours" can mean a temporary pack. Resolved: after redemption, it is a recurring **Usage Policy** for that **Site Visitor Owner**.
- "Waitlist" can sound like payment or checkout. Resolved: use **Support Waitlist Entry** for first-version willingness-to-pay collection without payment processing.
- **Support Waitlist Entry** can look related to usage because it appears inside the **Usage Limit Dialog**. Resolved: persist it in `site_usage_waitlist_entries`, separate from **Usage Event** accounting.
- "Feedback" can mean general product feedback, bug reports, or qualitative comments. Resolved: do not use feedback naming for the first-version waitlist table.

## Update Triggers

- Update this file when the default allowance changes.
- Update this file when **Metered Agent Turn** counting rules change.
- Update this file when invite-code redemption, policy configuration, or registry-boundary rules change.
- Update this file when **Usage Limit Dialog** copy, actions, or support-waitlist persistence changes.
