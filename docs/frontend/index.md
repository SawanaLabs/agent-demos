---
title: Frontend
description: Navigation for Next.js app and shared UI package conventions.
updateAt: 2026-05-28
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
- [Memory & Persistence Agent](./customer-memory-agent.md): Batch 6 rules for shared demo accounts, visitor-private sandbox threads, and cookie-scoped memory persistence.
- [Persistent Agent](./persistent-agent.md): Batch 6.5 rules for URL-backed chat persistence, visitor isolation, and resumable streams.
- [Homepage Gallery](./homepage-gallery.md): Product-facing homepage shape for presenting agent demos.
- [Loop Agent](./loop-agent.md): Stable UX and reasoning-display conventions for the support triage loop demo.
- [LangGraph Agent](./langgraph-agent.md): Stable integration conventions for the LangChain/LangGraph plus Next.js, AI SDK, and AI Elements demo.
- [MCP Agent](./mcp-agent.md): Stable source-core and UX conventions for the MCP Runtime Doctor Agent demo.
- [OpenAI Agents SDK Demo](./openai-agents-sdk-demo.md): Ultra-demo architecture, capability matrix, and bridge conventions for the OpenAI Agents SDK backend demo.
- [Registry Sync](./registry-sync.md): Author-side sync tooling and copy-ready rules for app-first registry demos.
- [Sandbox Agent](./sandbox-agent.md): Stable source-core, preview, and sandbox lifecycle conventions for the sandbox prototype builder demo.
- [shadcn Registry Distribution](./shadcn-registry-distribution.md): Rules for packaging Agent Demos as shadcn registry items.
- [Skills Agent](./skills-agent.md): Stable source-core, sandbox, and skill-catalog conventions for the skills-agent demo.
- [Trace and Eval Agent](./trace-eval-agent.md): Stable research-agent, session-trace, and eval-gate conventions for the trace-eval-agent demo.
- [Ultra Chatbot Agent](./ultra-chatbot-agent.md): Product and architecture boundary for the `vercel/chatbot` application-shape port.
- [Ultra Chatbot Agent Source Checklist](./ultra-chatbot-agent-source-checklist.md): Source-tree checklist for validating the `vercel/chatbot` port.
