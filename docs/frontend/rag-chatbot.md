---
title: RAG Chatbot
description: Stable source-core, indexing, retrieval, and grounded-answer conventions for the RAG Chatbot demo.
updateAt: 2026-06-08
---

# RAG Chatbot

## Scope

- Covers the shipped `rag-chatbot` Agent Demo under `apps/web/features/rag-chatbot`.
- Covers source-document indexing, pgvector retrieval, grounded answer behavior, and the visible retrieval trace.
- Applies the feature-slice and copy-boundary rules from [Agent Demo Structure](./agent-demo-structure.md).
- Applies the business direction from [Root Context](../../CONTEXT.md#rag-chatbot-direction).

## Domain Language

- **RAG Source Document**: The configured document that the demo indexes into durable storage before chat is available.
- **Knowledge Base Retrieval**: The chat tool path that embeds the user's question, searches pgvector-backed chunks, and returns source snippets.
- **Grounded Answer**: An assistant answer that is constrained to retrieved snippets and exposes citation labels or source pages in the conversation.

## Current Subdomain Docs

- Use `apps/web/features/rag-chatbot/` as the feature slice for this demo.
- Keep `apps/web/app/demos/rag-chatbot/page.tsx`, `apps/web/app/api/demos/rag-chatbot/route.ts`, and `apps/web/app/api/demos/rag-chatbot/index/route.ts` as thin route entries over the feature slice.
- Preserve the AI SDK RAG source core: document ingestion, chunking, embeddings, durable Postgres storage, pgvector similarity search, tool calling, and a bounded multi-step loop.
- Use the NASA Graphics Standards Manual as the current first `RAG Source Document`; show both the source PDF and NASA source page in the workspace.
- Do not imply trademark, logo, or commercial usage permission beyond the source document's own claims.
- Require `AI_GATEWAY_API_KEY` for chat and embedding generation. Require `DATABASE_URL` for pgvector-backed chat availability and source indexing.
- Keep `POST /api/demos/rag-chatbot/index` as the explicit source-indexing path for the configured document.
- Keep indexing idempotent by hashing the source PDF and reusing the existing resource when the content hash matches.
- Use explicit setup messages when Gateway, database, or index state is missing. Chat requests should fail clearly when the knowledge base is unavailable.
- The agent should call `getInformation` before answering document questions, answer only from indexed evidence, and use the refusal copy from the prompt when retrieval returns no useful evidence.
- Render retrieval tool state and retrieved sources inside the conversation so evaluators can inspect the evidence path beside the answer.
- Keep RAG-specific prompt, retrieval, indexing, schema, runtime, and UI logic feature-local until another demo has a real reuse need.

## Update Triggers

- Update this file when the RAG source document changes.
- Update this file when indexing, embedding, pgvector schema, retrieval thresholds, or grounded answer behavior changes.
- Update this file when chat availability, setup errors, or source-citation rendering changes.
- Update this file before adding user-uploaded document ingestion to the RAG demo.
