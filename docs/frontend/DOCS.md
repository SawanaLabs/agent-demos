---
title: Frontend Knowledge Protocol
description: Domain-level language, reading path, and boundary principles for frontend work.
updateAt: 2026-06-01
---

# Frontend Knowledge Protocol

## Reading Path

- Read this file before changing `apps/web`, `packages/ui`, Tailwind setup, shadcn components, AI Elements components, or frontend package imports.
- For agent demo work, read [Agent Demo Structure](./agent-demo-structure.md) after this file, then read the matching demo-specific doc when one exists.
- For shared UI package or wrapper work, read [Workspace UI](./workspace-ui.md) after this file.

## Domain Language

- **Frontend domain**: The `apps/web` Next.js app plus frontend-facing shared package code in `packages/ui`.
- **Shared UI primitive**: A low-level component, hook, Tailwind surface, or UI utility in `packages/ui` that stays generic enough to refresh without carrying one feature's behavior.
- **Feature-local wrapper**: A component beside the owning app or demo module that composes shared primitives into product-specific behavior, layout, or styling.

## Boundary Principles

- `packages/ui` is the frontend primitive layer. Keep it generic, reusable, and update-friendly.
- Do not change a shared primitive to satisfy one feature's product behavior, demo-specific layout, or bespoke styling.
- Put feature and app customization beside the owning frontend module, usually under `apps/web/features/<demo-slug>/ui` or `apps/web/components`, by wrapping `packages/ui` primitives there.
- Fundamental demo-shell UI under `apps/web/features/*`, `apps/web/components`, or `registry/*` should compose shadcn primitives and consumer theme tokens instead of hard-coding its own visual language. Let the consumer's chosen shadcn preset own panel shape, border density, and radius defaults whenever the product does not require a stronger decision.
- Avoid feature-local styling that fights the active shadcn preset, especially layout chrome such as `rounded-none`, bespoke border colors, and bare `div` panels that duplicate `card`, `button`, `badge`, `textarea`, or related primitives without using their tokens.
- Treat shadcn, AI Elements, Tailwind, hook, and utility primitives as periodically refreshable from upstream or repo-wide sources; feature behavior that would make those refreshes risky belongs outside `packages/ui`.
- Move a component or helper into `packages/ui` only after reuse is real and the API is generic enough to survive unrelated feature work.

## Form Copy

- Mark optional form fields in the visible label with a subdued `(optional)` suffix, for example `Message (optional)`, instead of relying only on placeholder copy.

## Update Triggers

- Update this file when frontend-wide ownership, wrapper placement, primitive refresh policy, or shared UI boundaries change.
- Update [Workspace UI](./workspace-ui.md) when `packages/ui` exports, shared styles, app provider wiring, shadcn component placement, or import paths change.
- Update [Agent Demo Structure](./agent-demo-structure.md) when a demo's feature-slice layout, UI copy boundary, or registry portability rules change.
