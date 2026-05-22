---
title: AI SDK Recipes Checklist
description: Working checklist for turning AI SDK recipe, guide, and docs examples into portable Agent Demos.
updateAt: 2026-05-23
---

# AI SDK Recipes Checklist

## Source Snapshot

- Target docs version: AI SDK 6 stable.
- Current public recipes index: `https://ai-sdk.dev/resources/recipes`.
- First public RAG source checked: `https://ai-sdk.dev/resources/recipes/guides/rag-chatbot`.
- Current check on 2026-05-22: the `/cookbook` root redirects to `/resources/recipes`; use "Recipes" as the public section label. The `/cookbook/guides/*` routes still return 200 and are sitemap-listed, but they are not the primary entrypoint.
- RAG source coverage: the public RAG Agent page covers AI SDK, Vercel AI Gateway, Drizzle ORM, Postgres with `pgvector`, shadcn-ui, and TailwindCSS.
- Do not treat stale copied URLs, canary routes, versioned preview routes, or `main` branch snippets as current without re-verifying the matching stable public recipe page.
- Use the stable public Recipes URL as the authority. `content/cookbook/**/*.mdx` paths below are source lookup aliases only and must be verified against the matching stable public route before implementation.
- Treat recipe inventory as drift-prone. Refresh the stable recipes index, the target recipe or guide page, and the relevant docs/reference pages before starting each new batch.

## Project Starting Point

- The repo is a pnpm/Turborepo monorepo with `apps/web` as the Next.js app and `packages/ui` as the shared shadcn/AI Elements package.
- `apps/web` currently depends on `ai` `^6.0.188` and `@ai-sdk/react` `^3.0.190`; it does not have a direct provider package dependency.
- AI Gateway provider wiring lives under `apps/web/features/shared/ai-gateway/server`, using `createGateway` from `ai`.
- The root `package.json` now declares `node >=22.13.0` because the current PDF-ingestion stack includes `pdfjs-dist`, which requires that runtime floor.
- `apps/web/app/page.tsx` is now the Demo Gallery. The catalog derives ready and roadmap groups from feature-local `demo-meta.ts` files.
- Existing project docs already define the default copy boundary: `apps/web/features/<demo-slug>` plus thin route/API entries under `apps/web/app`.
- `packages/database` now exports the RAG demo schema from `packages/database/src/schemas/rag-chatbot.ts` and remains the shared Drizzle/Neon workspace package.
- Current ready demos on `main`: `foundation-chat`, `rag-chatbot`, `multimodal-chatbot`, `streaming-chat-shell`, and `content-review` as the Batch 5 object-generation slice.

## Non-Negotiable Workflow

- [ ] Refresh sources:
  - [ ] Open the current AI SDK Recipes page.
  - [ ] Inspect the matching `vercel/ai` source MDX file(s) when available.
  - [ ] Inspect the relevant AI SDK docs or reference page for current API shape.
- [ ] Pick the Canonical Source Example(s) for the next Agent Demo.
- [ ] Decide the implementation class:
  - [ ] `agent-demo`: worth an interactive demo workspace.
  - [ ] `merged-demo`: covered inside another demo.
  - [ ] `foundation`: needed as setup or shared capability.
  - [ ] `defer`: blocked by external account, infrastructure, or low demo value.
- [ ] Preserve the Source Core for official-docs-derived backend behavior.
- [ ] Keep frontend UX project-specific and AI Elements-first.
- [ ] Add dependencies only through `pnpm`.
- [ ] Add Python tooling only through `uv` if a recipe truly needs Python.
- [ ] Prefer explicit environment and capability errors over silent fallbacks.
- [ ] Retry once when a likely network issue blocks source refresh or dependency installation.
- [ ] Update this checklist when source inventory, batch grouping, or demo boundaries change.

## Per-Demo Definition Of Done

- [ ] `apps/web/features/<demo-slug>/demo-meta.ts` exists with `slug`, `title`, `summary`, `pattern`, `status`, and `source`.
- [ ] `apps/web/features/<demo-slug>/README.md` explains the business-facing capability and feature-slice file tree.
- [ ] `apps/web/app/demos/<demo-slug>/page.tsx` is a thin route entry.
- [ ] `apps/web/app/api/demos/<demo-slug>/route.ts` is a thin API entry when server interaction is needed.
- [ ] Demo-local UI lives under `apps/web/features/<demo-slug>/ui`.
- [ ] Demo-local agent/server code lives under `apps/web/features/<demo-slug>/agent` or `apps/web/features/<demo-slug>/server`.
- [ ] Shared UI primitives only move to `packages/ui` after reuse is real.
- [ ] The Demo Workspace is operable on first load and uses an empty state inside the workspace before interaction begins.
- [ ] Streaming, tool states, loading states, error states, and abort/retry behavior are visible where relevant.
- [ ] Provider/model credentials fail with a clear setup error.
- [ ] Core contracts have focused tests when the demo has reusable tools, schema parsing, message conversion, or persistence logic.
- [ ] `pnpm lint`, `pnpm typecheck`, and the relevant build/dev smoke check pass.
- [ ] Browser verification covers desktop and mobile viewports for layout and interaction.
- [ ] Homepage Demo Gallery shows ready demos and keeps roadmap demos visually separate from active demo entries.

## Version And Runtime Gates

- [x] Target AI SDK 6 stable Recipes pages and docs examples.
- [x] Install AI SDK dependencies as v6-compatible packages when implementation starts, using `pnpm` from the workspace. Current `apps/web` versions are `ai` `^6.0.188` and `@ai-sdk/react` `^3.0.190`.
- [x] Raise the root Node engine to `>=22.13.0` when the selected implementation depends on packages with that floor, and keep the runtime guard in sync.
- [x] Do not raise the project to Node `>=22.13.0` for AI SDK alone; only do it when a confirmed dependency requires it.
- [ ] Use AI SDK 6 API shapes from the stable docs, including `system`, `stepCountIs`, `convertToModelMessages`, `UIMessage`, `tool({ inputSchema })`, and `toUIMessageStreamResponse()` where the selected official example uses them.
- [ ] Verify all examples against the stable AI SDK 6 docs before coding. Do not trust canary v7 snippets or `main` branch snippets without public-route confirmation.

## Completed First Demo Wave

- [x] `foundation-chat` established the Batch 0 foundation slot.
- [x] `rag-chatbot` shipped as the first full Recipes-derived agent demo.
- [x] RAG source candidates used in the first wave:
  - [x] `https://ai-sdk.dev/resources/recipes/guides/rag-chatbot` - current public AI SDK RAG Agent recipe route.
  - [x] `https://ai-sdk.dev/resources/recipes` - current public Recipes index.
  - [x] `https://ai-sdk.dev/cookbook/guides/rag-chatbot` - still-live compatibility route for the same RAG Agent guide.
  - [x] `content/cookbook/00-guides/01-rag-chatbot.mdx` - source lookup alias only.
  - [x] `content/cookbook/05-node/100-retrieval-augmented-generation.mdx` - lower-level RAG reference.
  - [x] `content/cookbook/05-node/101-knowledge-base-agent.mdx` - related knowledge-base agent reference.
  - [x] `content/docs/03-ai-sdk-core/30-embeddings.mdx` - embeddings API reference.
  - [x] `content/docs/03-ai-sdk-core/15-tools-and-tool-calling.mdx` - tool calling and multi-step behavior.
- [x] Delivered narrow first-wave scope:
  - [x] One chat workspace.
  - [x] One retrieval question flow.
  - [x] Postgres with `pgvector` and a minimal Drizzle schema/migration.
  - [x] `getInformation` retrieval tool.
  - [x] Visible tool-call states for retrieval.
  - [x] Hard step limit with `stepCountIs(5)`.
  - [x] Clear setup errors for missing `AI_GATEWAY_API_KEY`, `DATABASE_URL`, or `pgvector`.
- [ ] Deferred from the original first-wave sketch:
  - [ ] A user-driven knowledge-base add flow in the product UI.
  - [ ] An `addResource` tool exposed in the demo workspace.
- [x] Defer general loop-agent work until the RAG demo is stable. `loop-agent` now covers the core Batch 2 tool-loop path; human approval remains deferred.
- [x] Current next recommended wave after the completed RAG, multimodal, and streaming demos: Batch 5 - Structured Output.

## Prerequisite Configuration Matrix

- [x] AI Gateway key: `AI_GATEWAY_API_KEY`.
- [ ] Base LLM access through Vercel AI Gateway. Start with the models used by the stable source page, then normalize model names in one feature-local config file.
- [ ] RAG database: `DATABASE_URL` for Postgres with `pgvector` enabled.
- [ ] RAG migration path: Drizzle config, resource table, embedding vector column, and vector index. Do not start with an in-memory store because the official example's useful contract is retrieval over durable knowledge.
- [ ] Embeddings model access through Gateway or the provider route used by the stable source page. The checked RAG source uses `openai/text-embedding-ada-002`; verify before implementation.
- [ ] Optional provider-native keys for provider-specific guides. Keep these out of the first demo unless the stable source page cannot run through Gateway.
- [ ] Slack app credentials before the Slackbot batch: bot token, signing secret, and a test workspace.
- [ ] MCP test server config before the MCP batch. Prefer a local safe server first, then add third-party MCP examples.
- [ ] External Postgres sandbox before Natural Language Postgres. Use a non-production database with read-only or tightly scoped credentials.
- [ ] Persistence database tables before memory, message save/restore, and context compaction demos.
- [ ] Observability target before telemetry demos. Decide whether this project uses Vercel Observability, local logs, or a small demo-local event table.
- [ ] Browser verification setup for every UI demo: desktop and mobile viewports.

## Merge Plan

### Batch 0 - Foundation

- [x] AI SDK 6 dependency and Gateway provider setup.
- [x] Runtime version confirmation.
- [x] Environment variable contract and `apps/web/.env.example`.
- [x] Initial Demo Gallery data model with one ready demo slot and four roadmap demos.
- [x] Shared demo metadata type and pattern union.

### Batch 1 - RAG Agent

- [x] Stable RAG source review.
- [x] Postgres with `pgvector` setup.
- [x] Drizzle schema and migration.
- [x] Resource creation flow.
- [x] Embedding and chunking pipeline.
- [ ] `addResource` tool.
- [x] `getInformation` retrieval tool.
- [x] Chat workspace with visible tool states.
- [x] Clear setup errors for missing Gateway key, database URL, or vector extension.

### Batch 2 - Loop And Tool Agent

- [x] Simple tool call.
- [x] Parallel tool calls.
- [x] Multi-step tool calls.
- [x] Manual agent loop as contrast/reference.
- [ ] Web search agent only if the provider/tool route is stable.
- [ ] Human approval as a follow-up once the loop demo is stable.

### Batch 3 - Chat And Streaming Shell

- [ ] Generate text.
- [ ] Generate text with chat prompt.
- [ ] Stream text.
- [ ] Stream text with chat prompt.
- [x] Shared `useChat` state.
- [x] Custom request body.
- [x] Custom stream format.
- [ ] Markdown chatbot memoization.

### Batch 4 - Multimodal And Files

- [x] Image prompt text generation.
- [x] File prompt text generation.
- [x] Chat with PDFs.
- [ ] Image generation.
- [ ] Gemini image generation/editing.
- [x] Multimodal agent guide.

### Batch 5 - Structured Output

- [x] Generate object.
- [ ] Generate object with file prompt.
- [ ] Generate object with reasoning model.
- [x] Stream object.
- [x] Stream object with image prompt.
- [ ] Record token usage after streaming object.
- [ ] Record final object after streaming object.
- [x] `content-review` now covers the first structured-output workspace: multimodal input, streamed object state, and assistant-message embedded object rendering.

### Batch 6 - Memory And Embeddings Extensions

- [ ] Custom memory tool.
- [ ] Agent context compaction.
- [ ] Embeddings.
- [ ] Batch embeddings.
- [ ] Message persistence and restore.
- [ ] Retrieval augmented generation and knowledge-base Node examples only as refinements to the RAG demo.

### Batch 7 - MCP And External Integrations

- [ ] MCP tools in Next.js.
- [ ] MCP tools in Node.
- [ ] MCP elicitation.
- [ ] MCP Apps docs review.
- [ ] Slackbot agent.
- [ ] Natural Language Postgres.
- [ ] Computer Use.
- [ ] Agent skills.

### Batch 8 - Reliability, Cost, And Observability

- [ ] Track agent token usage.
- [ ] Caching middleware.
- [ ] Local caching middleware.
- [ ] Dynamic prompt caching.
- [ ] Intercept fetch requests.
- [ ] Repair malformed JSON.
- [ ] Error handling.
- [ ] Telemetry and DevTools.

### Batch 9 - Generative UI And RSC

- [ ] Render visual interface in chat.
- [ ] Stream updates to visual interfaces.
- [ ] Record token usage after streaming UI.
- [ ] RSC generate/stream/call-tool examples only if they still fit the app direction.

### Batch 10 - Provider And Model Guides

- [ ] GPT-5.
- [ ] OpenAI Responses API.
- [ ] Claude 4.
- [ ] Claude 3.7 Sonnet.
- [ ] Gemini 3.
- [ ] Gemini image generation.
- [ ] Llama 3.1.
- [ ] OpenAI o1.
- [ ] OpenAI o3-mini.
- [ ] DeepSeek R1.
- [ ] DeepSeek V3.2.
- [ ] Treat these as a provider capability matrix unless a guide demonstrates a distinct Agent Pattern.

### Batch 11 - API Server Adapters

- [ ] Node.js HTTP server.
- [ ] Express.
- [ ] Hono.
- [ ] Fastify.
- [ ] Nest.js.
- [ ] In this Next.js monorepo, adapter examples should usually become reference notes or minimal route variants, not separate homepage demos.

## Source Inventory

### Guides

- [x] `00-guides/01-rag-chatbot.mdx` - RAG Agent - Batch 1.
- [x] `00-guides/02-multi-modal-chatbot.mdx` - Multi-Modal Agent - Batch 4.
- [ ] `00-guides/03-slackbot.mdx` - Slackbot Agent Guide - Batch 7.
- [ ] `00-guides/04-natural-language-postgres.mdx` - Natural Language Postgres - Batch 7.
- [ ] `00-guides/05-computer-use.mdx` - Get started with Computer Use - Batch 7.
- [ ] `00-guides/06-agent-skills.mdx` - Add Skills to Your Agent - Batch 7.
- [ ] `00-guides/07-custom-memory-tool.mdx` - Build a Custom Memory Tool - Batch 6.
- [ ] `00-guides/08-agent-context-compaction.mdx` - Compact Agent Context - Batch 6.
- [ ] `00-guides/17-gemini.mdx` - Get started with Gemini 3 - Batch 10.
- [ ] `00-guides/18-claude-4.mdx` - Get started with Claude 4 - Batch 10.
- [ ] `00-guides/19-openai-responses.mdx` - OpenAI Responses API - Batch 10.
- [ ] `00-guides/20-google-gemini-image-generation.mdx` - Google Gemini Image Generation - Batch 4 or 10.
- [ ] `00-guides/20-sonnet-3-7.mdx` - Get started with Claude 3.7 Sonnet - Batch 10.
- [ ] `00-guides/21-llama-3_1.mdx` - Get started with Llama 3.1 - Batch 10.
- [ ] `00-guides/23-gpt-5.mdx` - Get started with GPT-5 - Batch 10.
- [ ] `00-guides/23-o1.mdx` - Get started with OpenAI o1 - Batch 10.
- [ ] `00-guides/24-o3.mdx` - Get started with OpenAI o3-mini - Batch 10.
- [ ] `00-guides/25-r1.mdx` - Get started with DeepSeek R1 - Batch 10.
- [ ] `00-guides/26-deepseek-v3-2.mdx` - Get started with DeepSeek V3.2 - Batch 10.

### Next.js

- [ ] `01-next/10-generate-text.mdx` - Generate Text - Batch 3.
- [ ] `01-next/11-generate-text-with-chat-prompt.mdx` - Generate Text with Chat Prompt - Batch 3.
- [ ] `01-next/12-generate-image-with-chat-prompt.mdx` - Generate Image with Chat Prompt - Batch 4.
- [ ] `01-next/122-caching-middleware.mdx` - Caching Middleware - Batch 8.
- [ ] `01-next/20-stream-text.mdx` - Stream Text - Batch 3.
- [ ] `01-next/21-stream-text-with-chat-prompt.mdx` - Stream Text with Chat Prompt - Batch 3.
- [x] `01-next/22-stream-text-with-image-prompt.mdx` - Stream Text with Image Prompt - Batch 4.
- [x] `01-next/23-chat-with-pdf.mdx` - Chat with PDFs - Batch 4.
- [x] `01-next/24-stream-text-multistep.mdx` - streamText Multi-Step Cookbook - Batch 2.
- [ ] `01-next/25-markdown-chatbot-with-memoization.mdx` - Markdown Chatbot with Memoization - Batch 3.
- [x] `01-next/30-generate-object.mdx` - Generate Object - Batch 5.
- [ ] `01-next/31-generate-object-with-file-prompt.mdx` - Generate Object with File Prompt through Form Submission - Batch 5.
- [x] `01-next/40-stream-object.mdx` - Stream Object - Batch 5.
- [x] `01-next/70-call-tools.mdx` - Call Tools - Batch 2.
- [x] `01-next/72-call-tools-multiple-steps.mdx` - Call Tools in Multiple Steps - Batch 2.
- [ ] `01-next/73-mcp-tools.mdx` - Model Context Protocol (MCP) Tools - Batch 7.
- [x] `01-next/74-use-shared-chat-context.mdx` - Share useChat State Across Components - Batch 3.
- [ ] `01-next/75-human-in-the-loop.mdx` - Human-in-the-Loop with Next.js - Batch 2 or 7.
- [ ] `01-next/77-track-agent-token-usage.mdx` - Track Agent Token Usage - Batch 8.
- [x] `01-next/80-send-custom-body-from-use-chat.mdx` - Send Custom Body from useChat - Batch 3.
- [x] `01-next/85-custom-stream-format.mdx` - Streaming with Custom Format - Batch 3.
- [ ] `01-next/90-render-visual-interface-in-chat.mdx` - Render Visual Interface in Chat - Batch 9.

### Node

- [ ] `05-node/10-generate-text.mdx` - Generate Text - merged into Batch 3.
- [ ] `05-node/100-retrieval-augmented-generation.mdx` - Retrieval Augmented Generation - Batch 1.
- [ ] `05-node/101-knowledge-base-agent.mdx` - Knowledge Base Agent - Batch 1.
- [ ] `05-node/11-generate-text-with-chat-prompt.mdx` - Generate Text with Chat Prompt - merged into Batch 3.
- [ ] `05-node/12-generate-text-with-image-prompt.mdx` - Generate Text with Image Prompt - Batch 4.
- [ ] `05-node/20-stream-text.mdx` - Stream Text - merged into Batch 3.
- [ ] `05-node/21-stream-text-with-chat-prompt.mdx` - Stream Text with Chat Prompt - merged into Batch 3.
- [ ] `05-node/22-stream-text-with-image-prompt.mdx` - Stream Text with Image Prompt - Batch 4.
- [ ] `05-node/23-stream-text-with-file-prompt.mdx` - Stream Text with File Prompt - Batch 4.
- [ ] `05-node/30-generate-object-reasoning.mdx` - Generate Object with a Reasoning Model - Batch 5.
- [x] `05-node/30-generate-object.mdx` - Generate Object - merged into Batch 5.
- [x] `05-node/40-stream-object.mdx` - Stream Object - merged into Batch 5.
- [x] `05-node/41-stream-object-with-image-prompt.mdx` - Stream Object with Image Prompt - Batch 5.
- [ ] `05-node/45-stream-object-record-token-usage.mdx` - Record Token Usage After Streaming Object - Batch 5 or 8.
- [ ] `05-node/46-stream-object-record-final-object.mdx` - Record Final Object after Streaming Object - Batch 5.
- [x] `05-node/50-call-tools.mdx` - Call Tools - merged into Batch 2.
- [x] `05-node/51-call-tools-in-parallel.mdx` - Call Tools in Parallel - Batch 2.
- [ ] `05-node/52-call-tools-with-image-prompt.mdx` - Call Tools with Image Prompt - Batch 4 or 2.
- [x] `05-node/53-call-tools-multiple-steps.mdx` - Call Tools in Multiple Steps - Batch 2.
- [ ] `05-node/54-mcp-tools.mdx` - Model Context Protocol (MCP) Tools - Batch 7.
- [x] `05-node/55-manual-agent-loop.mdx` - Manual Agent Loop - Batch 2 as contrast/reference.
- [ ] `05-node/56-web-search-agent.mdx` - Web Search Agent - Batch 2 or 7 depending on provider/tool choice.
- [ ] `05-node/57-mcp-elicitation.mdx` - Model Context Protocol (MCP) Elicitation - Batch 7.
- [ ] `05-node/60-embed-text.mdx` - Embed Text - Batch 6.
- [ ] `05-node/61-embed-text-batch.mdx` - Embed Text in Batch - Batch 6.
- [ ] `05-node/70-intercept-fetch-requests.mdx` - Intercepting Fetch Requests - Batch 8.
- [ ] `05-node/80-local-caching-middleware.mdx` - Local Caching Middleware - Batch 8.
- [ ] `05-node/85-repair-json-with-jsonrepair.mdx` - Repair Malformed JSON with jsonrepair - Batch 8.
- [ ] `05-node/90-dynamic-prompt-caching.mdx` - Dynamic Prompt Caching - Batch 8.

### API Servers

- [ ] `15-api-servers/10-node-http-server.mdx` - Node.js HTTP Server - Batch 11.
- [ ] `15-api-servers/20-express.mdx` - Express - Batch 11.
- [ ] `15-api-servers/30-hono.mdx` - Hono - Batch 11.
- [ ] `15-api-servers/40-fastify.mdx` - Fastify - Batch 11.
- [ ] `15-api-servers/50-nest.mdx` - Nest.js - Batch 11.

### React Server Components

- [ ] `20-rsc/10-generate-text.mdx` - Generate Text - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/11-generate-text-with-chat-prompt.mdx` - Generate Text with Chat Prompt - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/20-stream-text.mdx` - Stream Text - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/21-stream-text-with-chat-prompt.mdx` - Stream Text with Chat Prompt - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/30-generate-object.mdx` - Generate Object - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/40-stream-object.mdx` - Stream Object - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/50-call-tools.mdx` - Call Tools - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/51-call-tools-in-parallel.mdx` - Call Tools in Parallel - Batch 9 only if RSC remains useful.
- [ ] `20-rsc/60-save-messages-to-database.mdx` - Save Messages To Database - Batch 6 or 9.
- [ ] `20-rsc/61-restore-messages-from-database.mdx` - Restore Messages From Database - Batch 6 or 9.
- [ ] `20-rsc/90-render-visual-interface-in-chat.mdx` - Render Visual Interface in Chat - Batch 9.
- [ ] `20-rsc/91-stream-updates-to-visual-interfaces.mdx` - Stream Updates to Visual Interfaces - Batch 9.
- [ ] `20-rsc/92-stream-ui-record-token-usage.mdx` - Record Token Usage after Streaming User Interfaces - Batch 9.

## Update Triggers

- Update this file when the AI SDK public Recipes page changes count, route shape, or redirect behavior.
- Update this file when `vercel/ai` source example files are added, removed, or renamed.
- Update this file when the repository target leaves AI SDK 6 stable or a stable source page changes its required APIs.
- Update this file after each completed Agent Demo so the remaining checklist stays honest.
