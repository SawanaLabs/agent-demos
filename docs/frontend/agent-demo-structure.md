---
title: Agent Demo Structure
description: Durable conventions for organizing independent full-stack agent demos as portable feature slices.
updateAt: 2026-06-02
---

# Agent Demo Structure

## Scope

- Covers route, API, feature, UI, and agent-code organization for independent demos under `apps/web`.
- Covers how demo-local UI relates to shared primitives in `packages/ui`.
- Covers copy-boundary expectations for future reuse in compatible Next.js and shadcn monorepo projects.
- Applies the frontend-wide primitive boundary from [Frontend Knowledge Protocol](./DOCS.md).

## Domain Language

- **Feature slice**: A demo-owned directory under `apps/web/features/<demo-slug>` that contains the implementation files for one agent demo.
- **Thin route entry**: A route file under `apps/web/app` that wires URL access to a feature slice without owning meaningful demo logic.
- **UI primitive**: A shared low-level component, hook, style primitive, or UI utility exported from `packages/ui`.
- **Demo UI component**: A feature-local component built from UI primitives for one agent demo's experience.
- **Demo metadata module**: A feature-local `demo-meta.ts` file that exposes the canonical catalog and documentation metadata for one agent demo.
- **Demo Workspace Shell**: The shared screen chrome in `apps/web/components/demo-workspace-shell.tsx` that owns the repeated Agent Demo page frame, breadcrumb, title, summary, badges, and workspace slot.
- **Demo Chat Controller Module**: The shared client hook and helpers in `apps/web/features/shared/chat/ui/use-demo-chat.ts` that own the repeated AI SDK `Chat`, `DefaultChatTransport`, `useChat`, `hasMessages`, and `isBusy` wiring for ordinary demo chat workspaces.
- **Visitor Owner Route Module**: The shared route-side module in `apps/web/features/shared/visitor-owner/server/route-owner.ts` that resolves a cookie-scoped visitor owner and appends the owner cookie around a route handler.
- **Metered Demo Route Module**: The published-site host wrapper in `apps/web/features/site-usage-gate/server/metered-demo-route.ts` that keeps site usage metering outside registry-copyable demo feature slices.

## Current Subdomain Docs

- Organize each implemented agent demo around a feature slice such as `apps/web/features/foundation-chat`.
- Keep `apps/web/app/demos/<demo-slug>/page.tsx` as a thin route entry that imports the feature slice's page-level UI for ready demos.
- Keep `apps/web/app/api/demos/<demo-slug>/route.ts` as a thin API entry when a ready demo needs a route handler.
- Put demo-specific UI components under `apps/web/features/<demo-slug>/ui` once the demo has UI.
- Put demo-specific agent and server code under the same feature slice, using subdirectories such as `agent` and `server` when they clarify ownership.
- Every feature slice must include `demo-meta.ts`.
- `demo-meta.ts` must include at least `slug`, `title`, `summary`, `pattern`, `status`, and `source`.
- Define `pattern` as a TypeScript string-literal union or equivalent `as const` source of truth, not free-form strings.
- Keep `pattern` aligned with `apps/web/features/demo-catalog/types.ts`: `foundation`, `rag`, `loop`, `tools`, `skills`, `sandbox`, `multimodal`, `structured-output`, `mcp`, and `generative-ui`.
- Use `status` to separate `ready` demos from `roadmap` demos.
- Show `roadmap` demos as non-active roadmap items rather than interactive demo entries.
- Use `source` to distinguish AI SDK docs examples, original demos, and hybrid demos.
- Build early demos from AI SDK Recipes, guide, and documentation examples through manual review before planning original demo batches.
- Treat batch processing as a later workflow after the repository's demo style and copy boundary conventions are mature.
- Preserve the official example's core backend code path when converting a docs-derived demo; prefer path, boundary, and integration adjustments over custom rewrites.
- For demos whose backend source core comes from OpenAI Agents SDK, keep the official `@openai/agents` run path recognizable and prefer the official AI SDK UI bridge when the frontend stays on AI SDK UI.
- When official backend code conflicts with repository style, resolve in this order: preserve the source core, keep the feature-slice copy boundary, add explicit errors and readability, then polish style and abstractions.
- Avoid backend rewrites that make the official source core harder to recognize.
- If an official source core is a large single file, split it into cohesive feature-slice modules when that improves maintainability; keep the behavior, core control flow, and key code recognizable so the split remains structural abstraction instead of custom rewriting.
- Frontend implementation may diverge more from the official example so the demo can use AI Elements and meet the project's interaction quality bar.
- Shape each demo page primarily as an operable application workspace.
- Use the **Demo Workspace Shell** for implemented Agent Demo screens instead of copying the same `main`, breadcrumb, heading, summary, badge rail, and workspace wrapper in every feature slice.
- Keep feature-specific workspace implementation under `apps/web/features/<demo-slug>/ui`; the **Demo Workspace Shell** should own only the repeated screen chrome and workspace slot.
- For synced registry demos that use the **Demo Workspace Shell**, project `apps/web/components/demo-workspace-shell.tsx` through `scripts/registry-sync/shared-registry-assets.json` with an explicit `demos` list, and list the projected `components/demo-workspace-shell.tsx` file in the demo-owned registry item.
- Use the **Demo Chat Controller Module** for ordinary AI SDK chat demos whose client runtime only needs an endpoint-backed `DefaultChatTransport` or a custom `Chat` factory. Keep feature-local hooks focused on the demo endpoint and custom chat factory details.
- Keep route-backed, resumable, persisted, or heavily stateful chat surfaces local until their session state can be isolated cleanly behind the shared controller.
- For synced registry demos that use the **Demo Chat Controller Module**, project `apps/web/features/shared/chat/ui/use-demo-chat.ts` through `scripts/registry-sync/shared-registry-assets.json` with an explicit `demos` list, rewrite app aliases through the demo sync manifest, and list the projected `components/demo-chat/use-demo-chat.ts` file in the demo-owned registry item.
- Keep the page heading in normal document flow and put the primary **Demo Workspace** in a viewport-height wrapper at the desktop breakpoint, usually `lg:h-svh`; use the breakpoint where the workspace switches from stacked mobile layout into its desktop grid. Inside that wrapper, the workspace root and primary chat panel should use matching `h-full` plus `min-h-0` constraints so new messages scroll inside the workspace instead of extending the page.
- Put lightweight explanatory content in the empty state before user interaction, then replace it with messages, results, or agent state once interaction begins.
- Avoid top-heavy explanatory sections on demo pages.
- Prefer a user-facing default reading path. Answers, results, citations, and other end-user evidence should carry the main conversation, while developer-oriented traces or debug surfaces should stay available as secondary, usually collapsible, layers.
- Every implemented feature slice must include a lightweight `README.md`. Roadmap-only catalog stubs may contain only `demo-meta.ts` until implementation starts.
- The feature-local `README.md` should describe the demo's business-facing capability, show a concise file tree for the feature slice, and later include the shadcn registry install command once registry distribution exists.
- Do not turn the feature-local `README.md` into a dependency checklist or migration guide unless the user explicitly asks for that extra detail.
- Put shadcn components, AI Elements primitives, Tailwind primitives, hooks, and other shared front-end primitives in `packages/ui`.
- Keep `packages/ui` primitive-only under the shared boundary in [Frontend Knowledge Protocol](./DOCS.md).
- Use feature-local UI for components that compose shared primitives into one demo's product experience, including wrappers around `packages/ui` primitives.
- Keep demo-specific customization under `apps/web/features/<demo-slug>/ui` so shared primitives can be refreshed independently.
- Keep shared functions outside a feature slice only after reuse is real; do not prematurely create shared abstractions between demos.
- Treat a feature slice plus its thin route/API entries as the default copy boundary for migrating a demo into another compatible project.
- Published-site host augmentations, including the [Site Usage Gate](./site-usage-gate.md), are outside an **Agent Demo** copy boundary even when they wrap `apps/web/app/api/demos/*` route entries in this website.
- Published-site model-backed API route entries should use the **Metered Demo Route Module** for host metering and optional demo visitor ownership while keeping the demo runtime handler portable.
- Demo runtime handlers should remain independent from published-site host augmentations so registry route entries can call the demo behavior without site-only policy code.
- Do not import published-site host augmentation modules from `apps/web/features/<demo-slug>/` demo slices.
- For demos with cookie-scoped ownership, keep demo-specific visitor policy in a feature-local adapter over the **Visitor Owner Route Module**. Route entries should call that adapter, pass `visitorId` into the demo runtime, and leave cookie serialization plus `set-cookie` mutation inside the owner module.
- Keep **Site Visitor Owner** policy separate from demo-specific visitor owners. The published-site visitor cookie may reuse the shared cookie mechanics, but it remains a host augmentation and is not part of any Agent Demo copy boundary.
- Preserve compatibility with future shadcn registry distribution by keeping demo-owned files grouped and avoiding hidden cross-demo dependencies.
- When a demo is maintained app-first for registry distribution, treat `apps/web/features/<demo-slug>/` as the source of truth only after the slice is copy-ready under the rules in [Registry Sync](./registry-sync.md).
- When a demo is published through the shadcn registry, keep a portable registry source copy under `registry/<demo-slug>/` if the app feature slice depends on monorepo-only imports.
- Keep registry sync tooling outside feature slices under `scripts/registry-sync/` so author tooling does not become part of the runtime or distribution boundary.
- Keep shared app seams that can travel to registry, such as the **Demo Workspace Shell** and **Demo Breadcrumb**, in the shared registry asset manifest instead of repeating them in each demo-specific sync manifest.
- Use `foundation-chat` as the baseline registry reference when publishing the next demo. Reuse its registry directory shape, validation flow, and fresh-consumer acceptance path unless the registry distribution doc records a newer standard.
- Do not put `@workspace/*` imports or cross-demo shared feature imports in registry source files.
- Document the working registry install command in the feature-local `README.md` after the registry item exists.

## Update Triggers

- Update this file when the feature-slice layout changes.
- Update this file when a new shared UI primitive boundary appears in `packages/ui`.
- Update this file when a demo's copy boundary changes or shadcn registry distribution rules become concrete.
- Update this file when **Demo Workspace Shell**, **Demo Chat Controller Module**, **Visitor Owner Route Module**, or **Metered Demo Route Module** rules change.
