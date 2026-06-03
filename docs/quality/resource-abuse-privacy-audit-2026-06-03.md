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

The current repository is not ready for a public, unknown-traffic launch without a few focused fixes. The highest-risk gaps are helper routes that bypass the normal message gate:

1. Ultra file upload can write public Blob objects repeatedly and has no Blob cleanup story.
2. The "delete all DB and Blob content after 7 days" target is not implemented across all private demo stores.

## Existing Controls That Work

- Main model-backed routes commonly use `createMeteredDemoRoute` or `createVisitorOwnedMeteredDemoRoute`; the default policy allows 50 successful usage events per visitor per UTC day (`apps/web/features/site-usage-gate/server/policy.ts:6`, `apps/web/features/site-usage-gate/server/route-wrapper.ts:58`).
- OpenAI Agents SDK Realtime client-secret minting is wrapped by the Site Usage Gate and counts as `send_message` usage for `openai-agents-sdk-demo` (`apps/web/app/api/demos/openai-agents-sdk-demo/realtime/client-secrets/route.ts:6`).
- LangGraph's web route is metered before it calls the runtime, and the hosted FastAPI wrapper now requires the matching server-side `LANGGRAPH_AGENT_API_KEY` plus request `x-api-key` (`apps/web/app/api/demos/langgraph-agent/route.ts:6`, `apps/langgraph-agent-api/langgraph_agent/vercel_app.py:51`).
- Sandbox preview status checks now require a sandbox `sessionId`, compare the requested preview URL against the exact origin returned by the existing sandbox handle, do not create a sandbox session from the status route, avoid redirects, apply a 3 second timeout, and cap response body reads (`apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:37`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:97`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:160`, `apps/web/app/api/demos/sandbox-agent/preview-status/route.ts:190`).
- Customer Memory thread listing and loading filter by `customerId` plus `visitorId` (`apps/web/features/customer-memory-agent/server/thread-store.ts:159`, `apps/web/features/customer-memory-agent/server/thread-store.ts:276`).
- Persistent Agent chat loading, saving, and cleanup are visitor-scoped, and message rows cascade when chats are deleted (`apps/web/features/persistent-agent/server/chat-store.ts:128`, `apps/web/features/persistent-agent/server/chat-store.ts:139`, `apps/web/features/persistent-agent/server/schema.ts:56`).
- Ultra chat history, chat loading, writes, documents, suggestions, votes, and visibility routes are mostly visitor-scoped (`apps/web/features/ultra-chatbot-agent/server/chat-store.ts:179`, `apps/web/features/ultra-chatbot-agent/server/chat-store.ts:190`, `apps/web/features/ultra-chatbot-agent/server/chat-store.ts:336`).
- RAG source indexing is disabled in production (`apps/web/app/api/demos/rag-chatbot/index/route.ts:13`) and indexes a configured source document rather than arbitrary user-provided URLs (`apps/web/features/rag-chatbot/server/index-source.ts:72`).
- The deployed web app routes did not show a direct public path that writes this repository's source tree. Sandbox tools write inside Sandbox project roots such as `/vercel/sandbox/project` (`apps/web/features/shared/vercel-sandbox/server/session.ts:26`, `apps/web/features/ultra-chatbot-agent/server/sandbox-tools.ts:67`).

## Findings

### F1 - Medium/High - Ultra upload can repeatedly create public Blob objects and has no cleanup

Evidence:

- Upload route is visitor-owned but not usage-metered (`apps/web/app/api/demos/ultra-chatbot-agent/files/upload/route.ts:4`).
- Upload accepts PDF/JPEG/PNG and limits each file to 5MB (`apps/web/features/ultra-chatbot-agent/attachment-config.ts:1`, `apps/web/features/ultra-chatbot-agent/attachment-config.ts:7`).
- It writes Vercel Blob with `access: "public"` and returns the public URL (`apps/web/features/ultra-chatbot-agent/server/upload.ts:101`, `apps/web/features/ultra-chatbot-agent/server/upload.ts:104`, `apps/web/features/ultra-chatbot-agent/server/upload.ts:109`).
- `vercel.json` contains cleanup crons for Customer Memory, Persistent Agent, and Site Usage only; there is no Ultra or Blob cleanup cron (`vercel.json:3`).

Impact:

Repeated 5MB uploads can burn Blob storage and bandwidth. Public Blob URLs also mean privacy depends on URL secrecy. That may be acceptable for a demo, but it does not match a strict "private uploaded file" reading.

Recommendation:

Track uploaded blob `pathname`, visitor id, chat id, and created time in database storage. Meter uploads or add a per-visitor daily byte cap. Delete blobs when their owning chat is deleted and from a scheduled cleanup after the Demo Data Retention Window. If public Blob URLs remain, document that uploaded files are private by route ownership only, not by Blob access control.

### F2 - Medium - 7-day DB and Blob retention target is not implemented across stores

Evidence:

- Customer Memory cleanup retention is 3 days, not 7 (`apps/web/features/customer-memory-agent/server/cleanup.ts:7`).
- Customer Memory cleanup deletes memories and threads, but event rows keep `beforeContent` and `afterContent`; their foreign keys are `onDelete("set null")`, so event content can remain after thread/memory deletion (`apps/web/features/customer-memory-agent/server/cleanup.ts:214`, `apps/web/features/customer-memory-agent/server/schema.ts:110`, `apps/web/features/customer-memory-agent/server/schema.ts:121`, `apps/web/features/customer-memory-agent/server/schema.ts:138`).
- Persistent Agent cleanup retention is 3 days (`apps/web/features/persistent-agent/server/chat-store.ts:7`).
- Ultra database tables have cascade paths from chats to messages/documents/suggestions/streams, but there is no scheduled Ultra cleanup in `vercel.json` (`packages/database/src/schemas/ultra-chatbot-agent.ts:78`, `packages/database/src/schemas/ultra-chatbot-agent.ts:126`, `packages/database/src/schemas/ultra-chatbot-agent.ts:153`, `vercel.json:3`).
- Site usage events retain for 30 days (`apps/web/features/site-usage-gate/server/cleanup.ts:1`).

Impact:

The current implementation does not meet the stated "all database and Blob content deleted after 7 days" target. Some user-private Customer Memory event text can persist, Ultra chat data has no automatic expiration, Blob uploads have no expiration, and site usage telemetry keeps longer-lived visitor records.

Recommendation:

Define a single `Demo Data Retention Window` constant or clearly documented per-store policy. For the user's current target, add a 7-day cleanup for Ultra chats, messages, documents, suggestions, streams, votes, and Blob uploads; decide whether Customer Memory/Persistent Agent should remain stricter at 3 days or align to 7 days; delete Customer Memory events that contain private text; classify site usage/waitlist separately from private demo content.

### F3 - Medium/Low - Cookie-only ownership is acceptable for friendly traffic but easy to reset

Evidence:

- Visitor ownership is based on cookies (`apps/web/features/shared/visitor-owner/server/route-owner.ts:45`).
- Cookies use `HttpOnly` and `SameSite=Lax`, but do not set `Secure` (`apps/web/features/shared/visitor-owner/server/route-owner.ts:65`).
- The Site Usage visitor cookie lasts 365 days (`apps/web/features/site-usage-gate/server/viewer-context.ts:6`).
- Demo visitor cookies such as Ultra last 30 days (`apps/web/features/ultra-chatbot-agent/server/viewer-context.ts:3`).

Impact:

Visitor-to-visitor isolation is good enough for normal browsing, but a visitor can clear cookies to obtain a new identity and another allowance. This is consistent with the current personal-demo posture, but it is not abuse-resistant against automation.

Recommendation:

Set `Secure` on cookies in production. Accept cookie-reset bypass as a known limitation for the portfolio phase, or add a lightweight IP/user-agent hash only after real abuse appears. Do not add CAPTCHA by default for the current stated traffic model.

### F4 - Low/Medium - Customer Memory mutation lacks owner predicates at the final SQL layer

Evidence:

- Customer Memory list/read paths filter by `customerId` and `visitorId` (`apps/web/features/customer-memory-agent/server/memory-store.ts:352`, `apps/web/features/customer-memory-agent/server/memory-store.ts:368`).
- `getMemoryForMutation`, `updateMemory`, `deleteMemory`, and `markMemoryAccessed` operate by memory id and status only (`apps/web/features/customer-memory-agent/server/memory-store.ts:243`, `apps/web/features/customer-memory-agent/server/memory-store.ts:318`, `apps/web/features/customer-memory-agent/server/memory-store.ts:385`, `apps/web/features/customer-memory-agent/server/memory-store.ts:408`).

Impact:

The practical risk is low because memory ids normally come from already-filtered tool context. Still, if a memory id leaks or is guessed, the final mutation layer does not independently enforce visitor ownership.

Recommendation:

Pass `customerId` and `visitorId` into memory mutation methods and include them in the SQL `WHERE` clauses. This is a small defense-in-depth fix and aligns with the rest of the visitor-owner model.

### F5 - Low - Public docs MCP routes are read-only but expose repository docs

Evidence:

Public MCP routes were found for project docs and demo docs. The inspected behavior is read/search oriented and did not show project source mutation.

Impact:

This is acceptable if all exposed docs are intended public. It becomes a privacy issue if docs include private deployment notes, secrets, internal URLs, or unfinished product claims.

Recommendation:

Keep docs free of secrets and private deployment details. Add auth only if the docs are no longer intended as public demo material.

## Recommended Fix Order

1. Add Ultra upload metering/byte caps and Blob tracking.
2. Implement the 7-day cleanup story for Ultra DB rows, Blob uploads, and Customer Memory events.
3. Add production `Secure` cookies and owner predicates to Customer Memory mutations.

## Current Readiness Call

For a friendly personal portfolio with low traffic, main chat spend is reasonably controlled. For a public link that could receive automated traffic, the helper-route gaps above are real enough to fix before launch.
