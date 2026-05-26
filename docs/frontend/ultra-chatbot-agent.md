---
title: Ultra Chatbot Agent
description: Product and architecture boundary for the vercel/chatbot application-shape port.
updateAt: 2026-05-25
---

# Ultra Chatbot Agent

## Scope

- Covers the `ultra-chatbot-agent` Agent Demo.
- Covers an Application Shape Port of `vercel/chatbot` into this repository's Agent Demo structure.
- Keeps the implementation AI SDK based. The OpenAI Agents SDK demo remains a separate Agent Demo.

## Rules

- Port product capabilities and architectural intent, not the reference application's exact file layout or visual design.
- Keep the port completeness-first: every compatible `vercel/chatbot` capability stays in scope unless it conflicts with this repository's Agent Demo boundary.
- Keep the copy boundary centered on `apps/web/features/ultra-chatbot-agent` plus thin Next.js page and API route entries.
- Use a Visitor Owner for the first release while keeping the Owner concept explicit enough to support authenticated ownership later.
- Treat the entire auth tree from the reference app as an explicit first-release defer bucket. Ultra uses an HTTP-only visitor cookie in `apps/web/features/ultra-chatbot-agent/server/viewer-context.ts` and therefore does not port login, register, sign-out, guest-session bootstrap, or account navigation yet.
- Prefer this repository's feature-slice structure, AI Elements UI primitives, env-contract modules, and focused core-contract tests.
- Treat `persistent-agent` as the infrastructure reference for URL-backed persistence and resume streams, not as the place to keep growing chatbot-product features.

## Product Capability Boundary

- Use the pinned `vercel/chatbot` snapshot as the business behavior source of truth. Do not invent a separate default business scenario for this demo.
- Keep URL-backed chats, persistent messages, resumable generation, chat history, message voting, model/runtime profile display, tool call rendering, attachments, artifacts/documents, suggestions, and retention cleanup in scope.
- Keep `vercel/chatbot` capabilities in scope by default, including the artifact/document workflow. Remove or defer a capability only when it conflicts with this repository's demo boundary, local infrastructure, or release safety.
- Replace reference-app login ownership with Visitor Owner ownership for the first release.
- Defer only capabilities that conflict with this repository's identity boundary, infrastructure constraints, or release safety. Record the reason when a capability is deferred.

## Source Audit Rule

- Before implementation, audit the current `vercel/chatbot` source and map each product capability into one of three buckets: port now, adapt for this repo, or explicitly defer with a reason.
- Use `pnpm dlx opensrc` as the preferred way to fetch and read the pinned `vercel/chatbot` source during implementation work.
- Track the source audit in [Ultra Chatbot Agent Source Checklist](./ultra-chatbot-agent-source-checklist.md).
- Freeze implementation and acceptance to the source snapshot named in the checklist. Handle later upstream changes through a separate upstream refresh task.
- Use the source file tree as the checklist backbone. A source file is complete only when every needed function, component, route behavior, schema contract, or test fixture has been implemented, adapted, or explicitly deferred with a reason.
- Treat Auth.js login as an adapt-for-this-repo capability: first release uses Visitor Owner ownership.
- Treat exact file layout and visual styling as adapt-for-this-repo details unless a reference structure is required to preserve behavior.

## Delivery Rule

- Deliver the full `vercel/chatbot` capability set through vertical TDD slices.
- Each slice should connect UI, route handler, persistence, and observable behavior for one product capability before moving to the next.
- Do not deliver horizontal phases such as all schema first, then all routes, then all UI.
- Keep tests focused on the public behavior of each slice and use them as the core contract for that capability.
- Treat final user acceptance as checklist-complete acceptance. The Ultra Chatbot Agent is not done until every source-tree checklist item has been checked with an implementation, adaptation, or explicit disposition note.

## UI Direction

- Use a chat-first workspace.
- Keep history/sidebar navigation visible as a first-class product surface.
- Render the active conversation as the center of the workspace.
- Add an artifact/document browser as the companion surface for generated or edited documents, and open the heavy document detail in a dedicated dialog.
- When no artifact is selected, use the companion surface for runtime state, selected-message details, or developer-facing trace information.
- Include a model selector in the main workspace using AI Elements patterns.
- Reuse shared UI primitives from `packages/ui` whenever this repository already has an equivalent AI Elements or shadcn-style component. Checklist items for those upstream files are satisfied by explicit package-level equivalence, not by re-implementing duplicate feature-local wrappers.
- Reuse repository-level layout, theming, env-contract, ignore, license, and editor-config files when they already cover the same concern. Ultra does not fork root metadata or CI files unless the port truly needs a feature-specific variant.
- Treat demo-specific social assets and root component-registry metadata the same way: inherit shared app branding or shared package tooling until the Ultra port truly needs its own asset or registry contract.
- Reuse repository-level Next, PostCSS, TypeScript, lockfile, and deployment config the same way. Ultra lives inside the monorepo application and therefore disposes those upstream root files through explicit equivalence or deploy-boundary notes instead of cloning standalone app metadata.

## Model Direction

- Route model calls through this repository's AI Gateway and environment contract.
- Expose a small demo model set first: `openai/gpt-4.1-mini`, `openai/gpt-5-mini`, `deepseek/deepseek-v4-flash`, and `deepseek/deepseek-v4-pro`.
- Attach capability metadata to each model, including reasoning, vision, attachment handling, artifact tooling, and expected latency/cost posture.
- If a selected model does not support the active input or tool capability, disable that path in the UI or fail fast in the route handler.
- Implement entitlements as a demo-local capability policy first; do not introduce paid account tiers for the Visitor Owner release.

## Current Slice

- The first implemented slice already covers route-backed chat creation, visitor-owned identity, model selection, Postgres message persistence, and Redis-backed resume streams.
- The second implemented slice now adds a dedicated history sidebar with visitor-scoped pagination, active-chat navigation, and clear-all behavior through `/api/demos/ultra-chatbot-agent/history`.
- The third implemented slice now adds visitor-owned assistant-message voting through `/api/demos/ultra-chatbot-agent/vote` and inline message feedback controls.
- The fourth implemented slice now adds a route-aware conversation header and visitor-owned visibility switching through `/api/demos/ultra-chatbot-agent/[id]/visibility`.
- The fifth implemented slice now adds visitor-owned user-message editing, server-side trailing-message trim, and replay from the edited turn through `/api/demos/ultra-chatbot-agent/[id]/messages`.
- The sixth implemented slice now adds the first document companion surface through `apps/web/features/ultra-chatbot-agent/server/document-store.ts`, `server/documents.ts`, `app/api/demos/ultra-chatbot-agent/document/route.ts`, and `ui/ultra-chatbot-agent-document-panel.tsx`. The current cut is intentionally manual and text-first: a visitor can create a scratch document, reopen it, edit it, and save new versions from the right-hand panel while the full tool-driven artifact chain is still pending.
- The seventh implemented slice now bridges chat and documents with a real AI SDK tool. `apps/web/features/ultra-chatbot-agent/server/create-document.ts` registers `createDocument` inside the runtime, chat messages render the tool state through the shared AI Elements `Tool` component, and completed tool outputs can reopen the saved document in the right-hand companion panel.
- The eighth implemented slice now adds persisted document suggestions. `apps/web/features/ultra-chatbot-agent/server/request-suggestions.ts` registers `requestSuggestions` inside the runtime, `app/api/demos/ultra-chatbot-agent/suggestions/route.ts` exposes the latest-version suggestion list for the current visitor, and `ui/ultra-chatbot-agent-document-suggestions.tsx` renders those sentence-level rewrites in the companion panel. This cut intentionally stops short of the reference app's transient data-part stream and in-editor highlight workflow; those remain editor-slice work.
- The ninth implemented slice now adds empty-state suggested actions. `apps/web/features/ultra-chatbot-agent/constants.ts` defines the prompt chip catalog, `ui/ultra-chatbot-agent-suggested-actions.tsx` renders it through the shared AI Elements suggestion primitive, and the workspace routes those clicks through the same `handleSubmit` path as a typed prompt so route promotion, persistence, and streaming behavior stay identical.
- The tenth implemented slice now adds assistant reasoning rendering. `ui/ultra-chatbot-agent-message-parts.ts` extracts reasoning parts from `UIMessage`, `ui/ultra-chatbot-agent-message-parts.test.ts` locks that contract down, and `ui/ultra-chatbot-agent-workspace.tsx` renders the result through the shared AI Elements `Reasoning` surface while keeping tool output above the answer body.
- The eleventh implemented slice now cleans up the AI boundary modules. `server/prompts.ts` owns the main chat prompt plus the document-review prompt, and `server/providers.ts` owns AI Gateway provider creation plus selected-model resolution for the runtime and document-suggestion tool path.
- The twelfth implemented slice now adds two more document tools: `server/edit-document.ts` handles exact string replacement for local edits, `server/update-document.ts` handles broader model-driven rewrites, `server/runtime.ts` registers both inside the chat runtime, and `ui/ultra-chatbot-agent-workspace.tsx` plus `ui/ultra-chatbot-agent-document-panel.tsx` now carry a lightweight refresh token so reopening the same document from a later tool call still reloads the newest saved version and suggestion state.
- The thirteenth implemented slice now ports the weather tool path. `server/get-weather.ts` handles city geocoding plus current forecast lookup through Open-Meteo, `server/runtime.ts` registers `getWeather` alongside the document tools, and `ui/ultra-chatbot-agent-weather.tsx` renders a compact weather card inline in the message stream.
- The fourteenth implemented slice now ports the first attachment path. `features/shared/vercel-blob/server/keys.ts` and `server/env.ts` add the shared Blob contract, `server/upload.ts` plus `app/api/demos/ultra-chatbot-agent/files/upload/route.ts` handle visitor-scoped image uploads into Vercel Blob, `ui/ultra-chatbot-agent-multimodal-input.tsx` stages PNG and JPEG attachments before send, `ui/ultra-chatbot-agent-preview-attachment.tsx` renders upload-state previews, and `chat-store.ts` now persists uploaded file metadata alongside the message row so resume and reload keep the attachment parts intact.
- The fifteenth implemented slice now promotes the document companion into an explicit artifact shell. `ui/use-ultra-chatbot-agent-artifact.ts` plus `ui/ultra-chatbot-agent-artifact-state.ts` own selected-document, refresh, and mode state; `ui/ultra-chatbot-agent-artifact.tsx` wraps the right-hand browser surface; `ui/ultra-chatbot-agent-document-browser.tsx`, `ui/ultra-chatbot-agent-document-detail.tsx`, and `ui/ultra-chatbot-agent-document-dialog.tsx` split browsing from heavy document detail; `ui/ultra-chatbot-agent-version-footer.tsx` adds version navigation, restore, and latest reset; and `ui/ultra-chatbot-agent-diff-view.tsx` adds a lightweight diff preview for text artifact history.
- The current artifact boundary is now explicit: Ultra fully treats versioned text documents as the first-class artifact kind, while executable code artifacts, spreadsheet artifacts, generated-image artifacts, and the richer ProseMirror editor stack remain recorded checklist defers behind execution, dependency, or release-surface boundaries.
- The current workspace shell and submit affordance are now fully disposed at checklist level. `ui/ultra-chatbot-agent-workspace.tsx` is the Ultra equivalent of the reference chat shell, and the shared `PromptInputSubmit` primitive already covers the upstream submit-button contract inside this repository's AI Elements stack.
- The remaining shell wrappers are thinner now. The reference preview shell is already absorbed into `ui/ultra-chatbot-agent-screen.tsx` plus the workspace empty state, and global toast chrome stays deferred behind shared Sonner infrastructure until Ultra's richer artifact and attachment flows actually need cross-panel notifications.
- Resume recovery, visibility switching, model-picker dialog behavior, and scroll-to-latest behavior already count as ported through local hook equivalents plus shared `packages/ui` primitives. Ultra does not keep one-for-one copies of the reference hooks when the repository-level AI Elements implementation already covers the same contract.
- Shared primitive equivalence now also covers the upstream `scroll-area`, `spinner`, and model-catalog test surfaces. Ultra already exercises those contracts through the shared suggested-action rail, busy-state composer UI, and `server/models.test.ts`, so the checklist can dispose them without creating duplicate feature-local wrappers.
- Shared primitive equivalence now also covers the upstream `code-block`, `select`, and `reasoning` surfaces. Ultra reaches them through the shared `Tool` renderer and the direct reasoning trace UI inside the chat workspace, so there is no reason to fork feature-local duplicates.
- Shared AI boundary equivalence now also covers the upstream prompt and provider modules through `server/prompts.ts` and `server/providers.ts`. Ultra keeps those seams feature-local instead of hiding them inline inside `runtime.ts` or inside individual tool modules.
- A wider batch of shared UI and utility wrappers is now fully disposed by package-level equivalence. Alert dialogs, button groups, hover cards, generic inputs and labels, popovers, separators, sheets, sidebars, skeletons, tooltips, the mobile-breakpoint hook, and `lib/utils.ts` are already owned by `packages/ui`, so Ultra does not clone feature-local copies of those files.
- The remaining open shell items are now narrower. Greeting is already covered by `ConversationEmptyState` plus suggested actions, icons stay as direct imports, auth-form stays outside the Visitor Owner boundary, and sidebar-toggle is deferred until Ultra actually adopts a collapsible shell.
- Root instrumentation and Playwright harness files are currently an explicit boundary, not an omission. Ultra keeps verification in focused feature-local Vitest contracts plus manual browser QA until the artifact and attachment surfaces settle enough to justify a dedicated root E2E layer.
- Shared database and root-metadata boundaries are now largely disposed. `packages/database/drizzle.config.ts`, the shared migration scripts and journal, and the feature-local Ultra stores cover the upstream root DB config plus broad query/util layers, while entitlements, proxy middleware, rate limiting, and preview assets are all now explicit boundary decisions recorded in the checklist instead of silent omissions.
- The remaining hook surface is also narrower now. The workspace itself already serves as Ultra's active-chat coordinator, and the shared `Conversation` stack already owns scroll-to-latest behavior, so the open hook cluster is now effectively down to artifact-specific state that still depends on the richer document/artifact port.
- The current UI is intentionally still lighter than the final `vercel/chatbot` surface. Artifact/document panels now cover create, exact edit, full rewrite, suggestion review, version navigation, restore, and lightweight diff preview for text documents, the weather tool path is live, and the first Blob-backed image attachment flow now works inside the composer and persisted message stream. Richer artifact canvases, per-item history actions, richer history grouping, and full message-action parity remain active port work.

## Data Model Direction

- Start with chat, message, stream, and vote tables.
- Add document and suggestion tables for the artifact/document editing experience after the base chat contract is stable.
- Store binary attachments and artifact assets in Vercel Blob.
- Store Blob URLs, content type, size, filename, and owner/chat/message/document relationships in Postgres.
- Keep message parts, votes, documents, suggestions, streams, and structured runtime state in Postgres.
- Keep the schema in a dedicated database schema file and re-export it through the database schema barrel.
- The current attachment slice stores Blob-backed file metadata inside the persisted message row, while the current artifact slice keeps selected-document and view-mode state feature-local in the workspace instead of persisting a separate global artifact store yet.

## Storage Direction

- Use Vercel Blob for uploaded files, images, and artifact assets.
- Use Postgres as the source of truth for ownership, relationships, document state, suggestions, votes, messages, and stream metadata.
- Fail fast when required Blob environment variables are missing; do not silently mock file persistence.
- The current document slice is manual and text-first on purpose. `vercel/chatbot`-style create/update/request-suggestions tools, attachment-backed artifacts, and richer artifact canvases remain active checklist work.
- The current tool-driven document slice now covers `createDocument`, `editDocument`, `updateDocument`, and `requestSuggestions`. Artifact-specific canvases, transient suggestion stream parts, and full data-stream-driven artifact state are still open work on the checklist.
- The current attachment slice intentionally starts with image uploads only, matching the pinned reference upload route more closely than the broader multimodal demos elsewhere in this repository.
