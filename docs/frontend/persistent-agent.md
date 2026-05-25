---
title: Persistent Agent
description: Batch 6.5 rules for URL-backed chat persistence, visitor isolation, and resumable streams.
updateAt: 2026-05-25
---

# Persistent Agent

## Scope

- Covers the `persistent-agent` demo under `apps/web/features/persistent-agent`.
- Covers one contract only: a chat becomes addressable at `/demos/persistent-agent/[id]`, restores from Postgres on refresh, and resumes an active stream through AI SDK UI resume endpoints.

## Rules

- Keep this demo separate from `customer-memory-agent`. Batch 6.5 is foundational chat persistence, not memory orchestration.
- Use the AI SDK UI message persistence and resume-stream docs as the server/client contract source.
- Keep visitor isolation cookie-scoped. This demo uses `pa_visitor_id` as an HTTP-only cookie and does not introduce a user table.
- Store messages row-by-row in Postgres, following the `vercel/chatbot` shape closely enough to keep each `UIMessage` independently addressable.
- Track the current resumable stream on the chat record through `activeStreamId`. Do not add a heavier stream-table abstraction unless the simpler contract stops working.
- Keep cleanup out of the request path. Expired visitor chats are deleted only by Vercel Cron.

## Data Model

- `persistent_agent_chats`
  - `id`
  - `visitorId`
  - `title`
  - `activeStreamId`
  - `createdAt`
  - `updatedAt`
- `persistent_agent_messages`
  - `id`
  - `chatId`
  - `messageId`
  - `role`
  - `parts`
  - `attachments`
  - `createdAt`

## Runtime Notes

- The root route starts as `/demos/persistent-agent`.
- The first send promotes the URL into `/demos/persistent-agent/[id]` on the client before the request finishes.
- Refresh loads persisted messages server-side.
- `resume: true` is enabled only when the stored chat still has an `activeStreamId`.
- Resume support depends on Redis via `resumable-stream`, so `REDIS_URL` is part of the setup contract for this demo.
- Reuse one module-level resumable-stream context and wire it to `after`. Recreating Redis clients per request adds enough latency to miss the refresh-resume window.

## Cleanup Contract

- Vercel Cron path: `/api/cron/persistent-agent-cleanup`
- Schedule: `0 20 * * *` UTC, which is 04:00 Asia/Shanghai
- Retention: delete chats whose `updatedAt` is older than three days
