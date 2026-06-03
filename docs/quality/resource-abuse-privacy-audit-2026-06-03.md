---
title: Resource Abuse and Privacy Audit - 2026-06-03
description: Repo-grounded findings for provider spend, Vercel resources, visitor-private data, retention, and code integrity.
updateAt: 2026-06-03
---

# Resource Abuse and Privacy Audit - 2026-06-03

## Scope

This review uses the repository's [Resource Abuse and Privacy Review](./resource-abuse-privacy-review.md) boundary. It evaluates public-demo abuse risk for model/provider spend, Vercel resources, Sandbox, Blob, visitor-private data, retention, and public write control over project code.

Assumed adversary: an unauthenticated public visitor who can automate public API calls, clear cookies, upload allowed files, and call every public route. This review does not assume leaked provider keys, Vercel dashboard access, GitHub access, database-console access, or maintainer compromise.

## Executive Summary

The main message routes have a real Site Usage Gate, and the visitor-owned demos mostly filter persisted chats by visitor cookie. That is enough for a personal portfolio if traffic stays friendly.

The current repository is closer to the stated demo posture now that code-owned database rows, Customer Memory event text, site-usage events, and Ultra Blob uploads share the 7-day Demo Data Retention Window.

The remaining launch caveats are narrower: provider-side Vercel Sandbox identities still need an explicit tagged cleanup if the product promise is "all Vercel resources are gone after 7 days", visitor cookies remain resettable, and one Customer Memory mutation layer still deserves owner predicates as defense in depth.

## Existing Controls That Work

- Main model-backed routes commonly use `createMeteredDemoRoute` or `createVisitorOwnedMeteredDemoRoute`; the default policy allows 50 successful usage events per visitor per UTC day (`apps/web/features/site-usage-gate/server/policy.ts:6`, `apps/web/features/site-usage-gate/server/route-wrapper.ts:58`).
- OpenAI Agents SDK Realtime client-secret minting is wrapped by the Site Usage Gate and counts as `send_message` usage for `openai-agents-sdk-demo` (`apps/web/app/api/demos/openai-agents-sdk-demo/realtime/client-secrets/route.ts:6`).
- LangGraph's web route is metered before it calls the runtime, and the hosted FastAPI wrapper now requires the matching server-side `LANGGRAPH_AGENT_API_KEY` plus request `x-api-key` (`apps/web/app/api/demos/langgraph-agent/route.ts:6`, `apps/langgraph-agent-api/langgraph_agent/vercel_app.py:51`).
- Sandbox preview status checks now require a sandbox `sessionId`, compare the requested preview URL against the exact origin returned by the existing sandbox handle, do not create a sandbox session from the status route, avoid redirects, apply a 3 second timeout, and cap response body reads (`apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:37`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:97`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:160`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:190`).
- Shared Vercel Sandbox creation now configures every demo-owned sandbox with a five-minute active-session timeout, stable demo tags, persistent snapshot expiration equal to the 7-day Demo Data Retention Window, and a keep-last-one snapshot policy that deletes evicted snapshots. Existing named sandboxes are updated with the same policy on reconnect (`apps/web/features/shared/vercel-sandbox/server/session.ts`).
- Ultra file uploads now require Visitor Owner routing plus `chatId`, write under `ultra-chatbot-agent/{visitorId}/{yyyy-mm-dd}/{chatId}/{uuid}-{filename}`, enforce a 20-file or 50MB per visitor/day Blob-list quota, delete Blob objects for per-chat and clear-history deletes, and run a combined 7-day database plus Blob cleanup cron (`apps/web/app/api/demos/ultra-chatbot-agent/files/upload/route.ts`, `apps/web/features/ultra-chatbot-agent/server/upload.ts`, `apps/web/features/ultra-chatbot-agent/server/blob-storage.ts`, `apps/web/features/ultra-chatbot-agent/server/history.ts`, `apps/web/features/ultra-chatbot-agent/server/cleanup.ts`, `apps/web/app/api/cron/ultra-chatbot-agent-cleanup/route.ts`, `vercel.json`).
- Customer Memory, Persistent Agent, Site Usage Gate, and Ultra cleanup modules now share the 7-day Demo Data Retention Window through `apps/web/features/shared/demo-data-retention/server/policy.ts`.
- Customer Memory cleanup now deletes visitor-private event rows older than the cutoff, including stored `beforeContent` and `afterContent` text (`apps/web/features/customer-memory-agent/server/cleanup.ts`).
- Customer Memory thread listing and loading filter by `customerId` plus `visitorId` (`apps/web/features/customer-memory-agent/server/thread-store.ts:159`, `apps/web/features/customer-memory-agent/server/thread-store.ts:276`).
- Persistent Agent chat loading, saving, and cleanup are visitor-scoped, and message rows cascade when chats are deleted (`apps/web/features/persistent-agent/server/chat-store.ts:128`, `apps/web/features/persistent-agent/server/chat-store.ts:139`, `apps/web/features/persistent-agent/server/schema.ts:56`).
- Ultra chat history, chat loading, writes, documents, suggestions, votes, visibility routes, and scheduled chat cleanup are mostly visitor-scoped or chat-owned (`apps/web/features/ultra-chatbot-agent/server/chat-store.ts`).
- RAG source indexing is disabled in production (`apps/web/app/api/demos/rag-chatbot/index/route.ts:13`) and indexes a configured source document rather than arbitrary user-provided URLs (`apps/web/features/rag-chatbot/server/index-source.ts:72`).
- The deployed web app routes did not show a direct public path that writes this repository's source tree. Sandbox tools write inside Sandbox project roots such as `/vercel/sandbox/project` (`apps/web/features/shared/vercel-sandbox/server/session.ts:26`, `apps/web/features/ultra-chatbot-agent/server/sandbox-tools.ts:67`).

## Findings

### F1 - Medium - Vercel Sandbox provider-side identities lack 7-day deletion

Evidence:

- Shared Vercel Sandbox creation now configures active-session timeout, demo tags, 7-day snapshot expiration, and keep-last-one snapshot retention (`apps/web/features/shared/vercel-sandbox/server/session.ts`).
- This covers active compute and provider-side filesystem snapshots for newly created or reconnected named sandboxes, but there is still no cron that lists and deletes old provider-side sandbox identities by tag and age.
- The installed Sandbox SDK exposes `Sandbox.list()` and instance deletion, so the missing piece is a repository tagging policy plus a cleanup route, not a provider limitation.

Impact:

Database, event, Blob content, active Sandbox sessions, and persistent Sandbox snapshots now meet the unified 7-day demo retention target in code-owned or provider-auto-managed layers. Provider-side sandbox identity metadata can still outlive that policy. That matters if the public promise includes every Vercel resource, not just filesystem state and app-owned data.

Recommendation:

Add a cron route that uses `Sandbox.list({ tags })`, filters by age, and calls deletion only for matching demo-owned sandboxes. Keep old untagged sessions out of automated deletion unless manually inspected.

### F2 - Medium/Low - Cookie-only ownership is acceptable for friendly traffic but easy to reset

Evidence:

- Visitor ownership is based on cookies (`apps/web/features/shared/visitor-owner/server/route-owner.ts:45`).
- Cookies use `HttpOnly` and `SameSite=Lax`, but do not set `Secure` (`apps/web/features/shared/visitor-owner/server/route-owner.ts:65`).
- The Site Usage visitor cookie lasts 365 days (`apps/web/features/site-usage-gate/server/viewer-context.ts:6`).
- Demo visitor cookies such as Ultra last 30 days (`apps/web/features/ultra-chatbot-agent/server/viewer-context.ts:3`).

Impact:

Visitor-to-visitor isolation is good enough for normal browsing, but a visitor can clear cookies to obtain a new identity and another allowance. This is consistent with the current personal-demo posture, but it is not abuse-resistant against automation.

Recommendation:

Set `Secure` on cookies in production. Accept cookie-reset bypass as a known limitation for the portfolio phase, or add a lightweight IP/user-agent hash only after real abuse appears. Do not add CAPTCHA by default for the current stated traffic model.

### F3 - Low/Medium - Customer Memory mutation lacks owner predicates at the final SQL layer

Evidence:

- Customer Memory list/read paths filter by `customerId` and `visitorId` (`apps/web/features/customer-memory-agent/server/memory-store.ts:352`, `apps/web/features/customer-memory-agent/server/memory-store.ts:368`).
- `getMemoryForMutation`, `updateMemory`, `deleteMemory`, and `markMemoryAccessed` operate by memory id and status only (`apps/web/features/customer-memory-agent/server/memory-store.ts:243`, `apps/web/features/customer-memory-agent/server/memory-store.ts:318`, `apps/web/features/customer-memory-agent/server/memory-store.ts:385`, `apps/web/features/customer-memory-agent/server/memory-store.ts:408`).

Impact:

The practical risk is low because memory ids normally come from already-filtered tool context. Still, if a memory id leaks or is guessed, the final mutation layer does not independently enforce visitor ownership.

Recommendation:

Pass `customerId` and `visitorId` into memory mutation methods and include them in the SQL `WHERE` clauses. This is a small defense-in-depth fix and aligns with the rest of the visitor-owner model.

### F4 - Low - Public docs MCP routes are read-only but expose repository docs

Evidence:

Public MCP routes were found for project docs and demo docs. The inspected behavior is read/search oriented and did not show project source mutation.

Impact:

This is acceptable if all exposed docs are intended public. It becomes a privacy issue if docs include private deployment notes, secrets, internal URLs, or unfinished product claims.

Recommendation:

Keep docs free of secrets and private deployment details. Add auth only if the docs are no longer intended as public demo material.

## Recommended Fix Order

1. Add tagged Vercel Sandbox identity cleanup if "all Vercel resources disappear after 7 days" is part of the demo promise.
2. Add production `Secure` cookies.
3. Add owner predicates to Customer Memory mutations.

## Current Readiness Call

For a friendly personal portfolio with low traffic, main chat spend is reasonably controlled and code-owned database, event, Blob, and Sandbox snapshot retention now match the 7-day demo policy. For a public link that could receive automated traffic, provider-side Sandbox identity cleanup and visitor-cookie limitations are still real enough to fix before launch.
