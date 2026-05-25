---
title: shadcn Registry Distribution
description: Durable rules for packaging Agent Demos as shadcn registry items.
updateAt: 2026-05-25
---

# shadcn Registry Distribution

## Scope

- Covers source registry files under `registry/`.
- Covers generated static registry JSON under `apps/web/public/r/`.
- Covers how an **Agent Demo** becomes installable into a fresh Next.js App Router project initialized with shadcn/ui.

## Current Rules

- Keep `registry.json` as the root source registry and compose demo-owned registries with `include`.
- Put one demo's portable registry source under `registry/<demo-slug>/`.
- Build static registry output with `pnpm registry:build`; the output is served by the web app from `/r/<name>.json`.
- Treat the registry source as a portable copy boundary, not a direct mirror of `apps/web/features/<demo-slug>`.
- Registry source must not import `@workspace/*` packages or `apps/web/features/shared/*` modules.
- Registry source should import shadcn and AI Elements code through consumer-project aliases such as `@/components/ui/*`, `@/components/ai-elements/*`, and `@/lib/*`.
- Use `files[].target` placeholders such as `@components/` and `@lib/` for files that can follow the consumer project's `components.json`.
- Next.js route targets still need explicit `app/...` paths because shadcn registry target aliases do not provide an App Router placeholder.
- Explicitly list every directly consumed shadcn and AI Elements primitive in `registryDependencies`, even when the consumer project may already have some of them installed. Let the shadcn CLI deduplicate and merge.
- Use external AI Elements registry URLs in `registryDependencies` when they install cleanly. `foundation-chat` keeps `conversation` and `message` external, but ships its own `prompt-input` because the upstream registry version currently fails TypeScript checks against the current shadcn/Base UI stack.
- Explicitly list every package imported by registry-owned files in `dependencies`. Keep the consumer host contract narrow and documented, then let the package manager resolve duplicates.
- Use `envVars` only for local development examples such as `AI_GATEWAY_API_KEY`; do not encode production secrets or production-only values.

## Foundation Chat Item

- `foundation-chat` is the first registry block and proves the minimum installable demo shape.
- It installs a page route, API route, feature component pair, and AI SDK runtime helper.
- It intentionally keeps only the basic AI Gateway chat contract so the first registry item stays small enough to validate in fresh projects.
- Consumer-facing install syntax should standardize on a registry namespace:

```bash
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://your-deployment.example.com/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat
```

## Known Constraint

- `shadcn add` mapped the foundation chat route files into `src/app/...` during smoke testing, so this registry item can target `app/...` and let the consumer project's configured app directory decide the final placement.
