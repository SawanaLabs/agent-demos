# MCP Runtime Doctor Agent

This demo shows a ToolLoopAgent using AI SDK MCP clients without a user-facing mode switch.

The agent connects to:

- `project-docs`: a built-in HTTP MCP server for demo catalog and repository docs.
- `nextjs-runtime`: an optional stdio MCP server powered by `next-devtools-mcp` when a compatible Next.js dev server is running.

## Feature Slice

```txt
apps/web/features/mcp-agent/
  demo-meta.ts
  server/
    chat.ts
    env-source.ts
    env.test.ts
    env.ts
    mcp-clients.ts
    mcp-toolbox.ts
    project-docs-catalog.ts
    project-mcp-server.ts
    project-tools.ts
    runtime.ts
  ui/
    use-mcp-agent-chat.ts
    mcp-agent-screen.tsx
    mcp-agent-workspace.tsx
    mcp-runtime-sidebar.tsx
```

Thin route entries live under:

```txt
apps/web/app/demos/mcp-agent/page.tsx
apps/web/app/api/demos/mcp-agent/route.ts
apps/web/app/api/demos/mcp-agent/mcp/route.ts
```
