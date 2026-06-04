---
title: Resource Abuse and Privacy Review
description: Focused review boundary for protecting provider spend, hosted resources, private demo data, and project code integrity.
updateAt: 2026-06-04
---

# Resource Abuse and Privacy Review

## Scope

- Covers the focused review the user means when they ask for a security audit of this demo website.
- Covers abuse of model/provider calls, Vercel-hosted resources, Vercel Sandbox sessions, persistent storage, visitor-private data, and unintended write control over project code or workspace state.
- Main current surfaces include model-backed `/api/demos/*` route entries, the Site Usage Gate, demo-specific Visitor Owner route modules, file upload and RAG flows, sandbox-backed demos, MCP routes, cron routes, and Realtime or webhook routes.

## Domain Language

- **Resource Abuse and Privacy Review**: A focused readiness review for an **Agent Demo** that asks whether public operation can burn provider or infrastructure resources, expose private demo data, or gain unintended write control over project code or workspace state.
  _Avoid_: Full security audit, penetration test, compliance audit
- **Unauthenticated Public Visitor**: The default adversary model for this review: a public visitor with no login, no backend privileges, and no leaked secrets, but with the ability to automate public requests.
  _Avoid_: Authenticated user, internal operator, compromised maintainer
- **Private Demo Data**: Visitor-scoped **Agent Demo** data that should not be visible to another visitor, including messages, uploaded files, memories, votes, generated artifacts, and sandbox artifacts.
  _Avoid_: Sensitive data by default, regulated data, account data
- **Demo Data Retention Window**: The short-lived period after which visitor-scoped **Private Demo Data** should be removed from demo storage; the default target for this repository is seven days.
  _Avoid_: Permanent history, archive, backup policy
- **Message-First Portfolio Safety**: The default control strength for this personal portfolio-style demo site: meter model-backed turns first, keep hard limits on expensive inputs and tools, and avoid enterprise-grade bot defenses by default.
  _Avoid_: Enterprise abuse prevention, bot mitigation program, CAPTCHA-first security

## Review Rules

- Use this review name when the user's goal is abuse prevention and privacy protection for the published demo website.
- Do not default this review to a full dependency CVE audit, compliance audit, cloud account audit, or active production penetration test unless the user explicitly expands the scope.
- Use **Message-First Portfolio Safety** as the default control strength while this site is a personal portfolio project and visitors are assumed mostly friendly.
- Do not introduce CAPTCHA, device fingerprinting, heavyweight IP reputation, or enterprise anti-abuse controls by default. Revisit those only if the site is opened to substantial unknown traffic or observed abuse.
- Message or model-backed turn limits are the main control. They still need supporting hard limits for routes that can spend resources without a normal message turn, such as uploads, Realtime client-secret creation, sandbox creation, webhook handling, and indexing jobs.
- Use **Unauthenticated Public Visitor** as the default adversary model while the site has no login. The visitor can use a browser, curl, or scripts; clear cookies; send repeated or concurrent requests; spoof ordinary request headers; upload allowed file types; and call every public demo API route.
- Do not assume this adversary has Vercel, GitHub, database-console, provider-dashboard, or deployment access. Do not assume leaked environment variables or provider API keys unless the review scope is explicitly expanded.
- Use a lightweight privacy bar for this demo project: one visitor should not be able to see another visitor's **Private Demo Data** through normal public routes or direct API calls.
- Treat all visitor-scoped demo storage as temporary. **Private Demo Data** should be deleted from both database storage and Blob storage after the **Demo Data Retention Window**.
- During review, check the implementation instead of assuming the retention target is already met. Any demo with database rows, Blob objects, Redis state, sandbox artifacts, or external provider state needs an explicit cleanup story.
- Treat cost-bearing and state-changing provider surfaces as first-class review targets. LLM calls, Vercel Sandbox execution, Blob uploads, database writes, Redis-backed streams, webhooks, and cron-triggered cleanup should each have an abuse story before release.
- Keep privacy separate from usage limits. A usage gate can reduce spend, but it does not prove visitor-private chats, uploaded files, memories, votes, or sandbox artifacts are isolated.
- Keep project code integrity separate from sandbox artifact generation. A demo may create files inside a scoped runtime workspace, but public demo operation should not gain write control over this repository's source tree or registry source.
- Prefer explicit setup errors and hard gates for missing provider credentials or unsafe runtime state. Silent fallback can hide abuse paths and makes this review less useful.

## Update Triggers

- Update this file when the review scope changes.
- Update this file when a new cost-bearing, state-changing, privacy-sensitive, sandbox-backed, MCP-backed, webhook, upload, or cron surface appears.
- Update this file when the repository adopts a new usage-control, ownership, privacy, or code-integrity rule.
