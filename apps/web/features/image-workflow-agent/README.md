# Image Workflow Agent

This demo ships a canvas-first image workflow workspace where users and the agent mutate the same validated graph. The MVP covers app integration only: UI, app routes, metering, docs, catalog wiring, and environment contracts. It does not export a registry package yet.

Feature tree:

```text
image-workflow-agent/
  demo-meta.ts
  README.md
  model/
    workflow-engine.ts
    workflow-engine.test.ts
  server/
    chat.ts
    chat.test.ts
    env.ts
    env.test.ts
    image-executor.ts
    image-executor.test.ts
  ui/
    image-workflow-agent-canvas.tsx
    image-workflow-agent-chat-rail.tsx
    image-workflow-agent-mobile-result.tsx
    image-workflow-agent-model.test.ts
    image-workflow-agent-model.ts
    image-workflow-agent-node-views.tsx
    image-workflow-agent-screen.tsx
    image-workflow-agent-workspace.tsx
    use-image-workflow-agent.ts
```

Thin app entries live at:

```text
apps/web/app/demos/image-workflow-agent/page.tsx
apps/web/app/demos/image-workflow-agent/loading.tsx
apps/web/app/api/demos/image-workflow-agent/route.ts
apps/web/app/api/demos/image-workflow-agent/run/route.ts
```

MVP boundary:

- No registry export yet.
- No model or feature-server rewrites in this slice.
- No database, provider, or GitHub orchestration beyond the existing image workflow feature contracts.
