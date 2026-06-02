---
title: Multi-Modal Chatbot
description: Durable conventions for the image and PDF chat demo, including local QA boundaries for page-render hangs.
updateAt: 2026-06-02
---

# Multi-Modal Chatbot

## Scope

- Covers the image and PDF chat Agent Demo under `apps/web/features/multimodal-chatbot`.
- Covers the boundary between the thin Next.js route entries, the feature-local runtime, and the client workspace that sends file parts inline.
- Covers local QA triage when the page route hangs while the API route still answers.
- Applies the feature-slice and copy-boundary rules from [Agent Demo Structure](./agent-demo-structure.md).

## Domain Language

- **Multimodal message part**: An AI SDK UI message file part carrying an image or PDF attachment inline to the model.
- **Attachment session state**: Feature-local client state that owns pending file previews, message text extraction, retry, stop, and send behavior for this demo.
- **Multimodal runtime state**: Feature-local server state returned by `getMultimodalChatbotRuntimeState`, including accepted media types, setup availability, model name, Node version, and setup copy.
- **Dev artifact health check**: A local-only check for stale or corrupted Next.js dev output under `apps/web/.next` before changing demo source code.

## Current Subdomain Docs

- Use `apps/web/features/multimodal-chatbot/` as the feature slice for this demo.
- Keep `apps/web/app/demos/multimodal-chatbot/page.tsx` as a thin route entry that only renders `MultimodalChatbotScreen`.
- Keep `apps/web/app/api/demos/multimodal-chatbot/route.ts` as a thin API entry. The published-site metering wrapper is host policy; the portable demo behavior stays in `handleMultimodalChatbotRequest`.
- Keep accepted media types aligned between runtime state, client file input, and request validation: image attachments and PDF attachments only.
- Reject malformed JSON, invalid UI messages, and unsupported file media types with explicit errors instead of silent fallback.
- Preserve the official AI SDK multimodal source core: the request converts UI messages to model messages, streams through the configured Gateway model, and returns an AI SDK UI message stream response.
- Keep attachment preview, pending attachment removal, sample prompt send, retry, stop, and composer state feature-local. Do not move these helpers into shared chat code until reuse is real.
- The text-only API route can pass while the page route hangs. Local QA should split page-render health from API health instead of assuming one proves the other.
- For a local page-route hang, use this order before changing source:
  1. Confirm another page responds from the same dev server.
  2. Confirm `POST /api/demos/multimodal-chatbot` can answer a text-only request.
  3. Confirm the page and screen files have no unexpected source diff.
  4. Restart the dev server once.
  5. If the page still hangs and source is clean, move `apps/web/.next` aside and let Next.js cold rebuild it.
- Do not commit generated `.next` output or change demo source based only on a stale dev artifact.
- QA on 2026-06-02 resolved a local page hang after moving `apps/web/.next` aside and cold rebuilding. Final local checks returned `200` for the page route and `200` for the text-only API route.

## Update Triggers

- Update this file when accepted media types, UI message file-part conversion, runtime state, setup errors, or attachment session behavior changes.
- Update this file when the page/API route boundary changes.
- Update this file when local QA discovers a source-level page-render failure that should replace the dev artifact triage path above.
