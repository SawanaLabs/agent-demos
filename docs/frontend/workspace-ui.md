---
title: Workspace UI
description: Durable conventions for shared UI exports and Next.js app consumption.
updateAt: 2026-05-22
---

# Workspace UI

## Scope

- Covers `packages/ui`, `apps/web`, shared styles, shadcn component placement, and package export import paths.

## Domain Language

- **Export-map import**: An import path declared by `packages/ui/package.json` under `exports`.
- **App wrapper**: An app-specific component under `apps/web/components` that adapts shared UI or providers for the web app.

## Current Subdomain Docs

- Shared components belong in `packages/ui/src/components`.
- AI Elements components live in `packages/ui/src/components/ai-elements` and are consumed through the shared UI package export map.
- App-specific wrappers belong in `apps/web/components`; `apps/web/components/theme-provider.tsx` is an example.
- Add shadcn components with the repository pattern from `README.md`: `pnpm dlx shadcn@latest add button -c apps/web`.
- Consume UI components through package exports, for example `@workspace/ui/components/button`.
- `packages/ui/package.json` exports `./globals.css`, `./postcss.config`, `./lib/*`, `./components/*`, and `./hooks/*`.
- Keep export-map imports extensionless unless the export map changes. Current working examples include `@workspace/ui/globals.css`, `@workspace/ui/lib/utils`, `@workspace/ui/postcss.config`, and `@workspace/ui/components/ai-elements/conversation`.
- `apps/web/postcss.config.mjs` re-exports `@workspace/ui/postcss.config` so the app uses the shared Tailwind/PostCSS setup.
- `apps/web/app/layout.tsx` imports `@workspace/ui/globals.css` and applies the shared font variables through `cn`.

## Update Triggers

- Update this file when `packages/ui` exports change.
- Update this file when shared styles, app provider wiring, or shadcn component placement changes.
