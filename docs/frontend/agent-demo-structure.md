---
title: Agent Demo Structure
description: Durable conventions for organizing independent full-stack agent demos as portable feature slices.
updateAt: 2026-05-22
---

# Agent Demo Structure

## Scope

- Covers route, API, feature, UI, and agent-code organization for independent demos under `apps/web`.
- Covers how demo-local UI relates to shared primitives in `packages/ui`.
- Covers copy-boundary expectations for future reuse in compatible Next.js and shadcn monorepo projects.

## Domain Language

- **Feature slice**: A demo-owned directory under `apps/web/features/<demo-slug>` that contains the implementation files for one agent demo.
- **Thin route entry**: A route file under `apps/web/app` that wires URL access to a feature slice without owning meaningful demo logic.
- **UI primitive**: A shared low-level component or style primitive exported from `packages/ui`.
- **Demo UI component**: A feature-local component built from UI primitives for one agent demo's experience.
- **Demo metadata module**: A feature-local `demo-meta.ts` file that exposes the canonical catalog and documentation metadata for one agent demo.

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
- When official backend code conflicts with repository style, resolve in this order: preserve the source core, keep the feature-slice copy boundary, add explicit errors and readability, then polish style and abstractions.
- Avoid backend rewrites that make the official source core harder to recognize.
- If an official source core is a large single file, split it into cohesive feature-slice modules when that improves maintainability; keep the behavior, core control flow, and key code recognizable so the split remains structural abstraction instead of custom rewriting.
- Frontend implementation may diverge more from the official example so the demo can use AI Elements and meet the project's interaction quality bar.
- Shape each demo page primarily as an operable application workspace.
- Put lightweight explanatory content in the empty state before user interaction, then replace it with messages, results, or agent state once interaction begins.
- Avoid top-heavy explanatory sections on demo pages.
- Every implemented feature slice must include a lightweight `README.md`. Roadmap-only catalog stubs may contain only `demo-meta.ts` until implementation starts.
- The feature-local `README.md` should describe the demo's business-facing capability, show a concise file tree for the feature slice, and later include the shadcn registry install command once registry distribution exists.
- Do not turn the feature-local `README.md` into a dependency checklist or migration guide unless the user explicitly asks for that extra detail.
- Put shadcn components, AI Elements primitives, Tailwind primitives, and other shared front-end primitives in `packages/ui`.
- Use feature-local UI for components that compose shared primitives into one demo's product experience.
- Keep shared functions outside a feature slice only after reuse is real; do not prematurely create shared abstractions between demos.
- Treat a feature slice plus its thin route/API entries as the default copy boundary for migrating a demo into another compatible project.
- Preserve compatibility with future shadcn registry distribution by keeping demo-owned files grouped and avoiding hidden cross-demo dependencies.

## Update Triggers

- Update this file when the feature-slice layout changes.
- Update this file when a new shared UI primitive boundary appears in `packages/ui`.
- Update this file when a demo's copy boundary changes or shadcn registry distribution rules become concrete.
