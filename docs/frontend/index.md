---
title: Frontend
description: Navigation for Next.js app and shared UI package conventions.
updateAt: 2026-06-16
---

# Frontend

Use this domain when changing the Next.js app, shared UI package, Tailwind setup, shadcn components, AI Elements components, or component import paths.

## Domain Protocol

- Start with [Frontend Knowledge Protocol](./DOCS.md) for frontend-wide language, reading path, and boundary principles.
- For agent demo UI work, read [Frontend Knowledge Protocol](./DOCS.md), then [Agent Demo Structure](./agent-demo-structure.md), then the matching demo-specific doc when one exists.
- For `packages/ui`, shared styles, app wrappers, or component import paths, read [Frontend Knowledge Protocol](./DOCS.md), then [Workspace UI](./workspace-ui.md).

## Subdomains

- [Workspace UI](./workspace-ui.md): Shared primitive boundaries, UI package exports, app wrappers, app imports, and shadcn component placement.
- [AI SDK Recipes Checklist](./ai-sdk-recipes-checklist.md): Working checklist for converting AI SDK Recipes, guide, and docs examples into portable Agent Demos.
- [Agent Demo Structure](./agent-demo-structure.md): Copy-boundary layout for independent full-stack agent demos.
- [Depth Video Tool](./depth-video-tool.md): Browser-local short-video depth processing and the boundary between site tools and Agent Demos.
- [Generative UI](./generative-ui.md): Stable source-core and UX conventions for model-selected UI components rendered from AI SDK UI tool parts.
- [Minimal Chat Agent](./minimal-chat-agent.md): Source-backed conventions for hosted search, public GitHub lookup, and questionnaire-driven human-in-the-loop tool output.
- [Image Workflow Agent](./image-workflow-agent.md): Stable app-side conventions for the workflow canvas demo with graph-sync, manual run routing, and mobile chat fallback.
- [RAG Chatbot](./rag-chatbot.md): Stable source-core, indexing, retrieval, and grounded-answer conventions for the RAG Chatbot demo.
- [Memory & Persistence Agent](./customer-memory-agent.md): Batch 6 rules for shared demo accounts, visitor-private sandbox threads, and cookie-scoped memory persistence.
- [Persistent Agent](./persistent-agent.md): Batch 6.5 rules for URL-backed chat persistence, visitor isolation, and resumable streams.
- [Homepage Gallery](./homepage-gallery.md): Product-facing homepage shape for presenting agent demos.
- [Project Guide Companion](./project-guide-companion.md): Site-owned companion chatbot boundary, page visibility policy, and project-docs answer source.
- [Loop Agent](./loop-agent.md): Stable UX and reasoning-display conventions for the support triage loop demo.
- [LangGraph Agent](./langgraph-agent.md): Stable integration conventions for the LangChain/LangGraph plus Next.js, AI SDK, and AI Elements demo.
- [MCP Agent](./mcp-agent.md): Stable source-core and UX conventions for the MCP Runtime Doctor Agent demo.
- [Multi-Modal Chatbot](./multimodal-chatbot.md): Stable image/PDF chat conventions and local QA triage for page-render hangs.
- [OpenAI Agents SDK Demo](./openai-agents-sdk-demo.md): Ultra-demo architecture, capability matrix, and bridge conventions for the OpenAI Agents SDK backend demo.
- [Registry Sync](./registry-sync.md): Author-side sync tooling and copy-ready rules for app-first registry demos.
- [Sandbox Agent](./sandbox-agent.md): Stable source-core, preview, and sandbox lifecycle conventions for the sandbox prototype builder demo.
- [shadcn Registry Distribution](./shadcn-registry-distribution.md): Rules for packaging Agent Demos as shadcn registry items, plus the boundary for the public `/registry-guide` consumer guide.
- [Site Usage Gate](./site-usage-gate.md): Product-language boundary for published-site usage limits, metered turns, and access-code upgrades.
- [Skills Agent](./skills-agent.md): Stable source-core, sandbox, and skill-catalog conventions for the skills-agent demo.
- [System Status Pages](./system-status-pages.md): Branded app-level error, global-error, 404, and client exception reporting boundaries.
- [Trace and Eval Agent](./trace-eval-agent.md): Stable research-agent, product trace-panel, and eval-pipeline conventions for the trace-eval-agent demo.
- [Ultra Chatbot Agent](./ultra-chatbot-agent.md): Product and architecture boundary for the `vercel/chatbot` application-shape port.
- [Ultra Chatbot Agent Source Checklist](./ultra-chatbot-agent-source-checklist.md): Source-tree checklist for validating the `vercel/chatbot` port.

- [Canvas Agent](./canvas-agent.md): Independent branching workflow graph, floating conversation, execution stages, and result reuse.
- [无边画布节点职责与竞品研究](./canvas-node-research.md): 用户认可的节点职责表、图片与视频工作流竞品证据，以及节点粒度和结果复用的设计建议。

<!-- BEGIN:docs-generated-catalog -->
| File | Title | Description | Updated |
| --- | --- | --- | --- |
| ./DOCS.md | Frontend Knowledge Protocol | Domain-level language, reading path, and boundary principles for frontend work. | 2026-06-01 |
| ./agent-demo-structure.md | Agent Demo Structure | Durable conventions for organizing independent full-stack agent demos as portable feature slices. | 2026-07-01 |
| ./ai-sdk-recipes-checklist.md | AI SDK Recipes Checklist | Working checklist for turning AI SDK recipe, guide, and docs examples into portable Agent Demos. | 2026-06-16 |
| ./canvas-agent.md | Canvas Agent | Independent canvas workflow runtime and floating conversation contract. | 2026-09-20 |
| ./canvas-node-research.md | 无边画布节点职责与竞品研究 | 图片与视频工作流的节点分类、竞品证据，以及 Canvas Agent 的产品设计建议。 | 2026-09-20 |
| ./customer-memory-agent.md | Memory & Persistence Agent | Stable source-core, storage, and compaction conventions for the Batch 6 memory and persistence demo. | 2026-06-09 |
| ./depth-video-tool.md | Depth Video Tool | Product and runtime boundary for the browser-local depth video processor. | 2026-09-20 |
| ./generative-ui.md | Generative UI | Stable conventions for the Generative UI Agent Demo. | 2026-06-15 |
| ./homepage-gallery.md | Homepage Gallery | Durable conventions for the homepage surface that presents agent demos. | 2026-08-17 |
| ./image-workflow-agent.md | Image Workflow Agent | Stable UI, route, and copy-boundary conventions for the image workflow canvas demo. | 2026-08-20 |
| ./langgraph-agent.md | LangGraph Agent | Durable conventions for the LangChain/LangGraph plus Next.js, AI SDK, and AI Elements demo. | 2026-06-04 |
| ./loop-agent.md | Loop Agent | Stable UI, reasoning-display, and HITL conventions for the loop-agent support triage demo. | 2026-05-24 |
| ./mcp-agent.md | MCP Agent | Stable source-core and UX conventions for the MCP Runtime Doctor Agent demo. | 2026-06-11 |
| ./minimal-chat-agent.md | Minimal Chat Agent | Source-backed conventions for hosted search, public GitHub lookup, and questionnaire-driven human-in-the-loop tool output. | 2026-09-20 |
| ./multimodal-chatbot.md | Multi-Modal Chatbot | Durable conventions for the image and PDF chat demo, including local QA boundaries for page-render hangs. | 2026-06-02 |
| ./openai-agents-sdk-demo.md | OpenAI Agents SDK Demo | Complete copy-boundary, capability coverage, and bridge conventions for the ultra OpenAI Agents SDK demo running through AI Gateway. | 2026-06-16 |
| ./persistent-agent.md | Persistent & Resume Agent | Batch 6.5 rules for URL-backed chat persistence, visitor isolation, and resumable streams. | 2026-06-01 |
| ./project-guide-companion.md | Project Guide Companion | Site-owned companion chatbot boundary, page visibility policy, session history policy, model selector, and Project Docs MCP answer surface. | 2026-06-16 |
| ./rag-chatbot.md | RAG Chatbot | Stable source-core, indexing, retrieval, and grounded-answer conventions for the RAG Chatbot demo. | 2026-06-08 |
| ./registry-sync.md | Registry Sync | Author-side rules for keeping app-first Agent Demos aligned with registry copy boundaries. | 2026-06-04 |
| ./sandbox-agent.md | Sandbox Agent | Stable source-core, preview, and sandbox lifecycle conventions for the shipped sandbox-agent demo. | 2026-06-03 |
| ./shadcn-registry-distribution.md | shadcn Registry Distribution | Durable rules for packaging Agent Demos as shadcn registry items. | 2026-06-04 |
| ./site-usage-gate.md | Site Usage Gate | Product-language boundary for the published demo website's visitor usage limits and invitation-code upgrades. | 2026-06-03 |
| ./skills-agent.md | Skills Agent | Stable source-core, sandbox lifecycle, runtime toolchain, and UI conventions for the shipped skills-agent demo. | 2026-06-03 |
| ./system-status-pages.md | System Status Pages | Durable conventions for branded app-level error, global-error, 404, and client exception reporting surfaces. | 2026-08-17 |
| ./trace-eval-agent.md | Trace and Eval Agent | Stable research-agent, product trace-panel, and eval-pipeline conventions for the trace-eval-agent demo. | 2026-06-12 |
| ./ultra-chatbot-agent-source-checklist.md | Ultra Chatbot Agent Source Checklist | Source-tree checklist for the vercel/chatbot application-shape port. | 2026-05-28 |
| ./ultra-chatbot-agent.md | Ultra Chatbot Agent | Product and architecture boundary for the vercel/chatbot application-shape port. | 2026-06-04 |
| ./workspace-ui.md | Workspace UI | Durable conventions for shared UI exports and Next.js app consumption. | 2026-05-26 |
<!-- END:docs-generated-catalog -->
