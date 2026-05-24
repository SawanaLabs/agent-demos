---
title: MCP Agent
description: Stable source-core and UX conventions for the MCP Runtime Doctor Agent demo.
updateAt: 2026-05-24
---

# MCP Agent

## Scope

- Covers the shipped `mcp-agent` demo under `apps/web/features/mcp-agent`.
- Covers MCP server discovery, tool naming, and the no-mode chat UX.

## Domain Language

- **Project Docs MCP**: Built-in HTTP MCP server that exposes repository docs, demo catalog metadata, and the AI SDK recipes checklist.
- **Next.js Runtime MCP**: Optional stdio MCP server powered by `next-devtools-mcp` for local route, log, and runtime diagnostics.
- **Namespaced MCP tool**: A tool exposed to the model with a server prefix such as `project__read_demo_docs` or `nextjs__get_errors`.

## Current Subdomain Docs

- Use `@ai-sdk/mcp` `createMCPClient()` as the source-core bridge between MCP servers and AI SDK tools.
- Keep the first MCP agent as one normal chat workspace. Do not add a user-visible mode switch for Project Docs versus Next.js Runtime.
- Let the user's message and suggestion copy naturally reveal which MCP server should be used.
- Always connect the built-in Project Docs MCP server for out-of-box value.
- Treat the Next.js Runtime MCP server as optional. Surface its unavailable status explicitly, then continue with available MCP tools.
- Namespace all MCP tool names before handing them to the agent. Keep prefixes short and server-oriented: `project__*` and `nextjs__*`.
- Inject the connected server summary and available tool names into the agent instructions on each call.
- Close MCP clients when the stream finishes.
- Keep runtime sidebar content declarative: configured MCP servers, configured tools, transport type, and setup expectations.
- Project Docs MCP tools should read durable docs from `docs/` and feature-local `README.md` files rather than scraping rendered pages.
- The first suggestions should cover both scenes without a mode label: project docs review, Next.js runtime diagnostics, and checklist-driven demo planning.

## Update Triggers

- Update this file when a new MCP server is added or removed from `mcp-agent`.
- Update this file when MCP tool prefixes change.
- Update this file when the runtime sidebar stops reflecting configured MCP servers and tools.
