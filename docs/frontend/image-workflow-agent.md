---
title: Image Workflow Agent
description: Stable UI, route, and copy-boundary conventions for the image workflow canvas demo.
updateAt: 2026-08-14
---

# Image Workflow Agent

## Scope

- Covers the app-side UI, route integration, docs, catalog, and environment wiring for `apps/web/features/image-workflow-agent`.
- Covers the desktop canvas workspace, mobile chat-first fallback, and the graph-sync contract between local edits and streamed tool outputs.
- Does not redefine the model or feature-server implementation under `apps/web/features/image-workflow-agent/model` or `server`.

## Domain Language

- **Workflow graph**: The validated `WorkflowGraph` object shared by local direct manipulation, chat tool calls, and manual runs.
- **Run lock**: The client-side and engine-enforced state where manual graph mutation is blocked while the workflow result node is already running or a turn is still active.
- **Manual run route**: The thin app route at `apps/web/app/api/demos/image-workflow-agent/run/route.ts` that meters one turn, builds a run plan, executes it, and returns the updated graph.

## Current Subdomain Docs

- Keep all feature-local UI under `apps/web/features/image-workflow-agent/ui`.
- Keep the page entry at `apps/web/app/demos/image-workflow-agent/page.tsx` thin and server-only; it should read `getImageWorkflowAgentSetupState()` and pass that state into the workspace.
- The desktop workspace uses a 70/30 split: canvas on the left, chat rail on the right.
- Mobile hides the canvas entirely and shows chat, tool activity, and the latest result card in one column.
- All manual graph mutations must go through `applyWorkflowCommand`; do not mutate nodes or edges ad hoc in React state.
- React Flow node moves and deletions must map back into workflow commands so revision checks stay real.
- The client should replace local graph state with the newest streamed graph returned by tool outputs. Do not replay local command history after the server has already returned a newer graph revision.
- Keep metering in the app route layer with `createMeteredDemoRoute`; do not pull site usage gate modules into the feature slice.
- Treat this demo as ready in the catalog but omitted from registry export until a portable registry boundary exists.

## Update Triggers

- Update this file when the graph-sync contract changes.
- Update this file when the workspace layout rules change across desktop and mobile.
- Update this file when registry-export status changes.
