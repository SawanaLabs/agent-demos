---
title: Memory & Persistence Agent
description: Stable source-core, storage, and compaction conventions for the Batch 6 memory and persistence demo.
updateAt: 2026-06-01
---

# Memory & Persistence Agent

## Scope

- Covers the implemented `customer-memory-agent` demo under `apps/web/features/customer-memory-agent`.
- Covers the Batch 6 source-core boundary across memory, persistence, embeddings, and context compaction.
- Covers the current implementation for separate database schema, agent-only memory writes, semantic memory recall, and handoff-based thread compaction.
- Covers the current access model: three shared read-only demo accounts plus one visitor-private sandbox account keyed by an anonymous cookie visitor ID.

## Domain Language

- **Customer memory record**: The current durable fact, constraint, preference, risk, or follow-up that the agent keeps for one customer account and visitor scope.
- **Memory lifecycle event**: An audit event for a memory add, update, delete, recall hit, compaction capture, or noop decision. Events explain why a memory changed without turning the memory panel into an append-only note pile.
- **Persistent thread**: The saved chat conversation for one customer-memory session, including messages that can be restored across page loads or later visits.
- **Handoff compaction**: A server-generated handoff note that replaces older thread context once the message-count threshold is crossed, carrying forward previous handoff state plus newly compactable messages.
- **Compaction threshold**: The message-count limit that triggers handoff generation in the first implementation. Keep this count-based for now so the demo stays easy to test and debug.
- **Shared demo account**: A read-only customer account whose canonical threads, saved memories, and handoff compaction are shared across every visitor.
- **Visitor-private sandbox**: The writable fourth account. Its threads and saved memories are isolated by a cookie-scoped `visitorId`.
- **Visitor ID**: The anonymous browser identity stored in the `cm_visitor_id` HTTP-only cookie. This demo does not model a separate user table.

## Current Subdomain Docs

- Treat Batch 6 as one coherent customer-memory workspace. Do not split memory, persistence, embeddings, and compaction into disconnected technical demos.
- Use `https://ai-sdk.dev/docs/agents/memory` as the high-level API reference for this batch's source core.
- Use `https://ai-sdk.dev/cookbook/guides/custom-memory-tool` as the canonical public guide for explicit memory-tool behavior.
- Use `https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence` as the current public persistence reference for `useChat`-based chat restoration.
- Use `https://ai-sdk.dev/docs/ai-sdk-core/embeddings` and `https://ai-sdk.dev/cookbook/node/embed-text-batch` as the embeddings references when indexing or refreshing saved customer memory.
- Keep the memory write path agent-only in the first implementation. Do not add user-facing "save as memory" controls yet.
- Model saved memories as editable records with a lifecycle timeline, similar to mature memory products such as Mem0/Mem3. Prefer update/delete decisions over near-duplicate add-only memories.
- Use `manageCustomerMemory` as the single agent tool for memory lifecycle decisions. It supports `add`, `update`, `delete`, and `noop`; the server records matching lifecycle events after the assistant turn finishes.
- Store Batch 6 data in a separate database schema file under `packages/database/src/schemas/customer-memory-agent.ts`, then re-export it from the schema barrel. Do not mix customer-memory tables into the RAG schema file.
- The first implementation should persist thread messages, customer memory records, memory events, embeddings, and handoff compactions in database tables, not files or demo-local JSON blobs.
- Keep visitor-private cleanup out of the request path. Expired writable-demo threads should be deleted only by a scheduled cron job.
- The first three customer use cases are shared read-only demos. Their data still lives in Postgres; the UI simply blocks write operations and the server enforces the same restriction with explicit `403` errors.
- The fourth customer profile is `demo-sandbox`. It remains writable and persists to Postgres, but every browser is isolated by `visitorId`.
- Do not introduce a `userId` or owner table for this demo. `visitorId` is the only viewer identity dimension.
- Keep `cm_visitor_id` parsing, creation, serialization, and route response mutation behind the shared Visitor Owner Route Module. Route entries should use the feature-local `handleCustomerMemoryVisitorRequest` adapter and only pass `visitorId` into the runtime.
- Keep shared demo data and sandbox data on the same schema, and scope only the tables that need viewer isolation. Current isolation lives on customer-memory threads, memory records, memory events, and embeddings through `visitorId`/memory joins.
- Keep long-term customer memory separate from raw message history. The agent should not treat the entire restored thread as a memory store.
- First-version compaction uses handoff only. Do not add semantic recall inside the compaction path.
- When a previous handoff exists, the next compaction should merge that handoff with only the newly compactable message window. Avoid re-summarizing messages that are already covered by the previous handoff.
- If semantic recall is added later, keep it attached to customer memory retrieval, not to handoff compaction generation.
- The first compaction trigger is a message-count threshold, not token-usage thresholds. Message-count triggering is the current debugging and demo contract.
- Shared demo accounts should seed one canonical thread plus durable memory records into Postgres when the database is empty. Keep that bootstrap logic in a dedicated server module so the session loader stays shallow.
- The current cleanup contract runs on Vercel Cron at `0 20 * * *` UTC, which maps to 04:00 Asia/Shanghai. It deletes visitor-private threads whose `updatedAt` is older than three days, then removes their derived memory records, memory events, and cascaded embeddings.
- UI should make three surfaces visible: current thread, saved customer memories, and the latest handoff compaction.
- UI should keep memory lifecycle events available as a collapsed diagnostic surface. The primary user-facing memory state is the editable current memory record list.
- The first complete workspace should be three-pane: account and thread selection on the left, the persistent chat thread in the middle, and saved memories plus the latest handoff compaction on the right.
- The customer picker should label the first three accounts as read-only demos and the fourth account as a sandbox. While switching accounts or threads, show skeleton loading states instead of blank empty states.
- Assistant thinking states should use the AI Elements shimmer treatment with concise product language such as `Thinking…`.
- Context compaction should be visible inside the conversation timeline. Show a shimmer checkpoint while compaction is pending, then keep a completed checkpoint divider after the compacted message window.
- The first TDD slice should start with persistent thread storage and restoration. Memory writes and compaction should layer on top of that base.

## Known UX Debt

- The current implementation keeps message persistence and derived post-turn work in the AI SDK stream `onFinish` path. Message persistence belongs there, but slower derived work such as memory embedding refresh, handoff compaction generation, and session recall refresh can delay when the pending compaction checkpoint appears.
- Accept the small gap between assistant text completion and the compaction checkpoint UI for the current Batch 6 demo. Do not treat this gap as a blocking bug in the first implementation.
- A future production iteration should make compaction observable earlier with a pending-to-completed status model. Viable directions include predicting the pending checkpoint from local message count, persisting a pending compaction job/status, or moving handoff generation behind a Next/Vercel background task such as `after()`/`waitUntil()` with session refresh or polling.
- Keep `onFinish` as the AI SDK-aligned message persistence hook. When optimizing latency, move only slow derived work out of the user-visible response path.

## Update Triggers

- Update this file when the Batch 6 slug, scope, or canonical public source routes change.
- Update this file when customer memory storage moves away from a dedicated database schema.
- Update this file when visitor identity stops being cookie-scoped or when the demo adds a first-class user table.
- Update this file when memory writes become user-triggerable in addition to agent-triggered.
- Update this file when saved memory stops using editable records plus lifecycle events.
- Update this file when compaction stops using handoff-only state or stops using a message-count threshold.
