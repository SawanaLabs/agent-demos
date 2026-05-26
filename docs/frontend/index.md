---
title: Frontend
description: Navigation for Next.js app and shared UI package conventions.
updateAt: 2026-05-26
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
- [Homepage Gallery](./homepage-gallery.md): Product-facing homepage shape for presenting agent demos.
- [Loop Agent](./loop-agent.md): Stable UX and reasoning-display conventions for the support triage loop demo.
- [MCP Agent](./mcp-agent.md): Stable source-core and UX conventions for the MCP Runtime Doctor Agent demo.
- [Sandbox Agent](./sandbox-agent.md): Stable source-core, preview, and sandbox lifecycle conventions for the sandbox prototype builder demo.
- [Skills Agent](./skills-agent.md): Stable source-core, sandbox, and skill-catalog conventions for the skills-agent demo.
