---
title: Sandbox Agent
description: Stable source-core, preview, and sandbox lifecycle conventions for the shipped sandbox-agent demo.
updateAt: 2026-06-01
---

# Sandbox Agent

## Scope

- Covers the shipped `sandbox-agent` demo under `apps/web/features/sandbox-agent`.
- Covers the sandbox lifecycle, preview contract, and first shipped prototype-building slice.

## Domain Language

- **Sandbox workspace**: One named Vercel Sandbox bound to one AI SDK chat `id`.
- **Preview contract**: The agreement that a generated frontend prototype should be exposed on the sandbox preview port and shown through AI Elements `WebPreview`.
- **Prototype artifact**: A generated frontend file such as `index.html`, `styles.css`, or `app.js` that contributes to the live preview.

## Current Subdomain Docs

- Use the AI SDK `ToolLoopAgent` runtime plus `@vercel/sandbox` for the source core of this demo.
- Use the AI SDK chat `id` as the Vercel Sandbox `name`. Keep one persistent named sandbox per chat session.
- Keep sandbox persistence enabled and let Vercel own timeout-based shutdown. Do not add an application-level idle `stop()` timer.
- In the app runtime, keep shared sandbox lifecycle, file IO, retry, stop, and write-fallback behavior in `apps/web/features/shared/vercel-sandbox/server/session.ts`. Keep `apps/web/features/sandbox-agent/server/vercel-sandbox.ts` as a thin Adapter for demo env wiring and preview-port setup.
- Use the official `bash-tool` surface for `bash`, `readFile`, and `writeFile`.
- Keep `startPreview` as the one demo-specific tool that bridges generated static files to a live preview URL.
- Launch the preview server through the sandbox SDK's detached command path so the process survives the setup command that started it.
- Require `startPreview` to verify that the preview URL is actually reachable before reporting success; surface sandbox preview logs on failure.
- Keep the first implementation slice focused on static frontend prototypes built from HTML, CSS, and JavaScript.
- The first standard use case is a pricing landing page with an interactive calculator and a live preview.
- Show tool calls above the assistant body in the message trace.
- Split the workspace into `Conversation` and `Preview` tabs.
- Keep the live sandbox preview in the dedicated `Preview` tab with AI Elements `WebPreview`.
- Mirror the official AI Elements `WebPreview` composition inside the `Preview` tab: `WebPreviewNavigation`, navigation buttons, `WebPreviewUrl`, `WebPreviewBody`, and `WebPreviewConsole`.
- Keep the preview shell close to the official `WebPreview` example while adapting it to this product shell: use a `Copy preview URL` action instead of a URL-selection action.
- Remove extra preview framing in the `Preview` tab. The preview surface should sit flush in the tab content without an extra local card border, extra tab-to-preview gap, or an inner empty-state border.
- When a sandbox preview URL has already stopped or returns a non-OK status, surface that state explicitly inside the `Preview` tab instead of leaving a blank iframe.
- Keep the conversation tab free of inline iframes; preview affordances there should switch into the `Preview` tab.
- Keep the prompt composer only in the `Conversation` tab. The `Preview` tab should stay focused on the preview surface itself.
- Keep the runtime panel focused on configured tools, preview contract, and sandbox provider state.
- Keep the workspace aligned with the repository's default React split: `sandbox-agent-workspace.tsx` stays thin, stateful orchestration lives in custom hooks, and preview/message derivation lives in helper modules.

## Update Triggers

- Update this file when the sandbox provider changes away from `@vercel/sandbox`.
- Update this file when the preview contract changes away from `WebPreview` plus a fixed sandbox port.
- Update this file when the first shipped use case stops being a static frontend prototype workflow.
- Update this file when registry packaging starts deriving the portable `registry/sandbox-agent` sandbox runtime from the shared app Module.
