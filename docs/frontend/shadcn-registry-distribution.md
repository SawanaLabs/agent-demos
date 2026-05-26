---
title: shadcn Registry Distribution
description: Durable rules for packaging Agent Demos as shadcn registry items.
updateAt: 2026-05-26
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
- Prefer `registryDependencies` for shadcn primitives and support modules such as `utils`. In a `base-*` consumer project, plain names like `button`, `tooltip`, and `utils` resolve against the official shadcn registry for the active style.
- Registry-owned demo shell components should inherit the consumer project's shadcn language. Compose `button`, `badge`, `card`, `textarea`, theme tokens, and related primitives instead of hard-coding top-level panel geometry or writing local styling that overrides the preset's default radius and border character without a clear product reason.
- Finish the consumer project's own `pnpm dlx shadcn@latest init` flow before installing any demo item. That step installs the base preset dependencies behind official primitives such as `button`, including `@base-ui/react` and `class-variance-authority`.
- Use external AI Elements registry URLs in `registryDependencies` when they install cleanly. `foundation-chat` keeps `conversation` and `message` external, but ships its own `prompt-input` because the upstream registry version currently fails TypeScript checks against the current shadcn/Base UI stack.
- Explicitly list every package imported by registry-owned files in `dependencies`. Keep the consumer host contract narrow and documented, then let the package manager resolve duplicates.
- Use `envVars` only for local development examples such as `AI_GATEWAY_API_KEY`; do not encode production secrets or production-only values.

## Foundation Chat Item

- `foundation-chat` is the first registry block and proves the minimum installable demo shape.
- It installs a page route, API route, feature component pair, and AI SDK runtime helper.
- It depends on official shadcn registry primitives through `registryDependencies`, including `utils`, so a fresh consumer project gets the same base-nova source the CLI would install by hand.
- It intentionally keeps only the basic AI Gateway chat contract so the first registry item stays small enough to validate in fresh projects.
- Treat `registry/foundation-chat/` as the reference implementation for future demo registry items unless a later doc explicitly replaces it.
- Consumer-facing install syntax should standardize on a registry namespace:

```bash
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://your-deployment.example.com/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat
```

## Reference Pattern

When publishing the next demo, start from the `foundation-chat` registry shape and change only the demo-owned files and dependencies:

- Add a new `registry/<demo-slug>/registry.json`.
- Keep the demo item under the root `registry.json` through `include`.
- Put only portable demo-owned files in `files`, typically:
  - `app/demos/<demo-slug>/page.tsx`
  - `app/api/demos/<demo-slug>/route.ts` when the demo has a route handler
  - `components/<demo-slug>/*`
  - `lib/<demo-slug>/*`
  - any vendored exception component that cannot cleanly come from upstream registry sources
- Keep shared shadcn primitives in `registryDependencies`.
- Keep external AI Elements items in `registryDependencies` when they install cleanly.
- Keep every directly imported npm package in `dependencies`.
- Keep env examples in `envVars`.
- Keep monorepo-only imports out of registry source files.

The first move for a new demo should be structural copy from `registry/foundation-chat/`, followed by narrowing, not inventing a new registry layout from scratch.

## Known Constraint

- `shadcn add` mapped the foundation chat route files into `src/app/...` during smoke testing, so this registry item can target `app/...` and let the consumer project's configured app directory decide the final placement.

## Verified Bootstrap

Validated on May 26, 2026 against a fresh local consumer app:

```bash
pnpm dlx shadcn@latest init --preset b0 --template next
cd <your-app>
pnpm i
pnpm dlx shadcn@latest init
```

Choose:

- `Base`
- `Nova`

Then install the registry namespace and demo:

```bash
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://your-deployment.example.com/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat
```

Then set `AI_GATEWAY_API_KEY` in `.env.local` and run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm dev
```

Observed local CLI quirk:

- `pnpm dlx shadcn@latest init --preset b0 --template next` created the app files in this repo's smoke test but did not exit on its own. After the files existed, `pnpm i` completed the next step cleanly.

## Author Workflow

Author-side workflow for every new registry item:

```bash
pnpm --dir packages/ui exec shadcn registry validate registry.json -c ../..
pnpm registry:build
```

Then verify in a fresh consumer app:

```bash
pnpm dlx shadcn@latest init --preset b0 --template next
cd <your-app>
pnpm i
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=http://localhost:3000/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/<demo-slug>
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm dev
```

Do not treat a registry item as finished until the fresh consumer path passes. Validation and build prove schema correctness. The fresh consumer app proves distribution correctness.
