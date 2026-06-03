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

The current repository is closer to the stated demo posture now that code-owned database rows, Customer Memory event text, site-usage events, Ultra Blob uploads, and tagged Vercel Sandbox resources share the 7-day Demo Data Retention Window.

The remaining launch caveats are narrower: visitor identities are still resettable by clearing cookies, one Customer Memory mutation layer deserves owner predicates as defense in depth, and public docs routes should stay free of private deployment notes.

## Existing Controls That Work

- Main model-backed routes commonly use `createMeteredDemoRoute` or `createVisitorOwnedMeteredDemoRoute`; the default policy allows 50 successful usage events per visitor per UTC day (`apps/web/features/site-usage-gate/server/policy.ts:6`, `apps/web/features/site-usage-gate/server/route-wrapper.ts:58`).
- Visitor cookies keep `HttpOnly` and `SameSite=Lax`, and shared Visitor Owner cookies now add `Secure` automatically in production (`apps/web/features/shared/visitor-owner/server/route-owner.ts`).
- OpenAI Agents SDK Realtime client-secret minting is wrapped by the Site Usage Gate and counts as `send_message` usage for `openai-agents-sdk-demo` (`apps/web/app/api/demos/openai-agents-sdk-demo/realtime/client-secrets/route.ts:6`).
- LangGraph's web route is metered before it calls the runtime, and the hosted FastAPI wrapper now requires the matching server-side `LANGGRAPH_AGENT_API_KEY` plus request `x-api-key` (`apps/web/app/api/demos/langgraph-agent/route.ts:6`, `apps/langgraph-agent-api/langgraph_agent/vercel_app.py:51`).
- Sandbox preview status checks now require a sandbox `sessionId`, compare the requested preview URL against the exact origin returned by the existing sandbox handle, do not create a sandbox session from the status route, avoid redirects, apply a 3 second timeout, and cap response body reads (`apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:37`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:97`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:160`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:190`).
- Shared Vercel Sandbox creation now configures every demo-owned sandbox with a five-minute active-session timeout, stable demo tags, persistent snapshot expiration equal to the 7-day Demo Data Retention Window, and a keep-last-one snapshot policy that deletes evicted snapshots. Existing named sandboxes are updated with the same policy on reconnect (`apps/web/features/shared/vercel-sandbox/server/session.ts`).
- Vercel Sandbox provider-side identity cleanup is now covered by a `CRON_SECRET`-protected daily cron route. It lists only sandboxes tagged with `app=ai-elements-demos` and `retention=7d`, filters by the 7-day age window, deletes via `Sandbox.get({ resume: false })`, and leaves old untagged sandboxes out of automation for manual provider inspection (`apps/web/features/shared/vercel-sandbox/server/cleanup.ts`, `apps/web/app/api/cron/vercel-sandbox-cleanup/route.ts`, `vercel.json`).
- Ultra file uploads now require Visitor Owner routing plus `chatId`, write under `ultra-chatbot-agent/{visitorId}/{yyyy-mm-dd}/{chatId}/{uuid}-{filename}`, enforce a 20-file or 50MB per visitor/day Blob-list quota, delete Blob objects for per-chat and clear-history deletes, and run a combined 7-day database plus Blob cleanup cron (`apps/web/app/api/demos/ultra-chatbot-agent/files/upload/route.ts`, `apps/web/features/ultra-chatbot-agent/server/upload.ts`, `apps/web/features/ultra-chatbot-agent/server/blob-storage.ts`, `apps/web/features/ultra-chatbot-agent/server/history.ts`, `apps/web/features/ultra-chatbot-agent/server/cleanup.ts`, `apps/web/app/api/cron/ultra-chatbot-agent-cleanup/route.ts`, `vercel.json`).
- Customer Memory, Persistent Agent, Site Usage Gate, and Ultra cleanup modules now share the 7-day Demo Data Retention Window through `apps/web/features/shared/demo-data-retention/server/policy.ts`.
- Customer Memory cleanup now deletes visitor-private event rows older than the cutoff, including stored `beforeContent` and `afterContent` text (`apps/web/features/customer-memory-agent/server/cleanup.ts`).
- Customer Memory thread listing and loading filter by `customerId` plus `visitorId` (`apps/web/features/customer-memory-agent/server/thread-store.ts:159`, `apps/web/features/customer-memory-agent/server/thread-store.ts:276`).
- Persistent Agent chat loading, saving, and cleanup are visitor-scoped, and message rows cascade when chats are deleted (`apps/web/features/persistent-agent/server/chat-store.ts:128`, `apps/web/features/persistent-agent/server/chat-store.ts:139`, `apps/web/features/persistent-agent/server/schema.ts:56`).
- Ultra chat history, chat loading, writes, documents, suggestions, votes, visibility routes, and scheduled chat cleanup are mostly visitor-scoped or chat-owned (`apps/web/features/ultra-chatbot-agent/server/chat-store.ts`).
- RAG source indexing is disabled in production (`apps/web/app/api/demos/rag-chatbot/index/route.ts:13`) and indexes a configured source document rather than arbitrary user-provided URLs (`apps/web/features/rag-chatbot/server/index-source.ts:72`).
- The deployed web app routes did not show a direct public path that writes this repository's source tree. Sandbox tools write inside Sandbox project roots such as `/vercel/sandbox/project` (`apps/web/features/shared/vercel-sandbox/server/session.ts:26`, `apps/web/features/ultra-chatbot-agent/server/sandbox-tools.ts:67`).

## Findings

### F1 - Low/Medium - Customer Memory mutation lacks owner predicates at the final SQL layer

Evidence:

- Customer Memory list/read paths filter by `customerId` and `visitorId` (`apps/web/features/customer-memory-agent/server/memory-store.ts:352`, `apps/web/features/customer-memory-agent/server/memory-store.ts:368`).
- `getMemoryForMutation`, `updateMemory`, `deleteMemory`, and `markMemoryAccessed` operate by memory id and status only (`apps/web/features/customer-memory-agent/server/memory-store.ts:243`, `apps/web/features/customer-memory-agent/server/memory-store.ts:318`, `apps/web/features/customer-memory-agent/server/memory-store.ts:385`, `apps/web/features/customer-memory-agent/server/memory-store.ts:408`).

Impact:

The practical risk is low because memory ids normally come from already-filtered tool context. Still, if a memory id leaks or is guessed, the final mutation layer does not independently enforce visitor ownership.

Recommendation:

Pass `customerId` and `visitorId` into memory mutation methods and include them in the SQL `WHERE` clauses. This is a small defense-in-depth fix and aligns with the rest of the visitor-owner model.

### F2 - Low - Public docs MCP routes are read-only but expose repository docs

Evidence:

Public MCP routes were found for project docs and demo docs. The inspected behavior is read/search oriented and did not show project source mutation.

Impact:

This is acceptable if all exposed docs are intended public. It becomes a privacy issue if docs include private deployment notes, secrets, internal URLs, or unfinished product claims.

Recommendation:

Keep docs free of secrets and private deployment details. Add auth only if the docs are no longer intended as public demo material.

## Recommended Fix Order

1. Add owner predicates to Customer Memory mutations.
2. Keep public docs free of secrets and private deployment details.

## Current Readiness Call

For a friendly personal portfolio with low traffic, main chat spend is reasonably controlled and code-owned database, event, Blob, and tagged Sandbox resource retention now match the 7-day demo policy. For a public link that could receive automated traffic, cookie-reset limitations and Customer Memory mutation hardening are still real enough to track before launch.
