---
title: shadcn Registry Distribution
description: Durable rules for packaging Agent Demos as shadcn registry items.
updateAt: 2026-05-28
---

# shadcn Registry Distribution

## Scope

- Covers source registry files under `registry/`.
- Covers generated static registry JSON under `apps/web/public/r/`.
- Covers how an **Agent Demo** becomes installable into a fresh Next.js App Router project initialized with shadcn/ui.
- Covers the boundary between the public consumer guide at `/registry` and these internal author-side rules.

## Public Consumer Guide

- `/registry` is the public **Registry Guide Page** for **Registry Consumers** who have not forked this repository.
- The public page should be blog-readable but executable: concise setup context, the namespace command, the `foundation-chat` mainline install command, required env vars, agent-facing guidance, and short setup notes for other supported registry demos.
- The public page should use `agent-demos.hsawana9.com` as the production host in commands:

```bash
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://agent-demos.hsawana9.com/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat
```

- Public copy should link inline to source material such as the GitHub repo, shadcn registry docs, AI SDK docs, and AI Elements docs.
- Keep author maintenance, publishing, sync tooling, and fresh-consumer acceptance details in this internal document instead of duplicating them on `/registry`.
- Homepage registry entry points should stay compact. The current public entry appears on the homepage and points to `/registry`; demo screen-level install hints are planned separately.

## Current Rules

- Keep `registry.json` as the root source registry and compose demo-owned registries with `include`.
- Put one demo's portable registry source under `registry/<demo-slug>/`.
- Build static registry output with `pnpm registry:build`; the output is served by the web app from `/r/<name>.json`.
- Treat `pnpm registry:build` as a packaging step only. It turns source `registry.json` files into distributable JSON. It does not derive registry source files from `apps/web/features/*`.
- Treat the registry source as a portable copy boundary, not a direct mirror of `apps/web/features/<demo-slug>`.
- Keep every file referenced by a demo-owned `registry/<demo-slug>/registry.json` inside that registry chunk directory. Current shadcn CLI validation rejects parent-directory traversal such as `../feature.tsx`, so a registry item cannot point straight at app feature files outside its owned tree.
- Registry source must not import `@workspace/*` packages or `apps/web/features/shared/*` modules.
- Registry source should import shadcn and AI Elements code through consumer-project aliases such as `@/components/ui/*`, `@/components/ai-elements/*`, and `@/lib/*`.
- Use `files[].target` placeholders such as `@components/` and `@lib/` for files that can follow the consumer project's `components.json`.
- Next.js route targets still need explicit `app/...` paths because shadcn registry target aliases do not provide an App Router placeholder.
- Prefer `registryDependencies` for shadcn primitives and support modules such as `utils`. In a `base-*` consumer project, plain names like `button`, `tooltip`, and `utils` resolve against the official shadcn registry for the active style.
- Registry-owned demo shell components should inherit the consumer project's shadcn language. Compose `button`, `badge`, `card`, `textarea`, theme tokens, and related primitives instead of hard-coding top-level panel geometry or writing local styling that overrides the preset's default radius and border character without a clear product reason.
- Registry-owned demo components must target the public contract of the official shadcn primitive they declare in `registryDependencies`. Do not rely on workspace-local extensions such as extra slot exports or child composition APIs unless the registry item vendors that primitive itself.
- Finish the consumer project's own `pnpm dlx shadcn@latest init` flow before installing any demo item. That step installs the base preset dependencies behind official primitives such as `button`, including `@base-ui/react` and `class-variance-authority`.
- Use external AI Elements registry URLs in `registryDependencies` when they install cleanly. `foundation-chat` keeps `conversation` and `message` external, but ships its own `prompt-input` because the upstream registry version currently fails TypeScript checks against the current shadcn/Base UI stack.
- Explicitly list every package imported by registry-owned files in `dependencies`. Keep the consumer host contract narrow and documented, then let the package manager resolve duplicates.
- Treat fresh consumer acceptance as the final dependency-closure check. In the current CLI flow, nested `registryDependencies` did not reliably pull every transitive npm package into a clean consumer app, so each demo item must still declare the runtime packages its installed files need.
- When registry-owned files import non-TypeScript assets or support files such as `.md`, `.yaml`, `.py`, `.png`, or `.svg`, declare those entries as `registry:file`. Do not mark them as `registry:lib`, because `shadcn add` may try to parse them as code during transforms.
- Keep page-facing runtime state seams shallow. If a demo page only needs setup state, do not let its imported runtime module statically pull route-only chat/tool dependencies into the Server Component build graph.
- For demos that use `bash-tool`, `just-bash`, or other heavy route-only packages, prefer a split between page-facing runtime state and request handling, and prefer delayed imports for the heavy server path so a fresh consumer `pnpm build` does not fail under Next.js 16 Turbopack.
- Registry copies must be valid from the consumer target path, not just from the source feature path. Relative imports that work under `apps/web/features/<demo-slug>/...` may break after files move into `components/<demo-slug>/` or `lib/<demo-slug>/`.
- Use `envVars` only for local development examples such as `AI_GATEWAY_API_KEY`; do not encode production secrets or production-only values.
- Do not hand-edit generated files under `apps/web/public/r/`. Rebuild them from source registry files with `pnpm registry:build`.

## Source Ownership

- `shadcn build` and the producer-side `shadcn/registry` loaders both consume source registry files. They solve distribution. They do not remove the need for a maintained source registry tree.
- This means the repo still needs an explicit ownership model for demo preview code versus registry source code. Current `foundation-chat` keeps an app preview implementation and a registry implementation because the registry copy uses consumer-project aliases and cannot import workspace-only modules.
- The current preferred ownership model is app-first plus explicit sync, once a demo is copy-ready under [Registry Sync](./registry-sync.md).
- Keep per-demo sync tooling under `scripts/registry-sync/`.
- Keep registry-only wiring files under registry ownership even in an app-first model. That includes `registry/<demo-slug>/registry.json`, route-entry files, vendored exception files, and generated output under `apps/web/public/r/`.
- If a demo is not copy-ready yet, fix the slice before introducing sync tooling. Do not use sync as a workaround for a tangled boundary.
- Until a sync step exists for a given demo, update the app preview files and the registry source files in the same change and verify both paths.

## Foundation Chat Item

- `foundation-chat` is the first registry block and proves the minimum installable demo shape.
- It installs a page route, API route, feature component pair, and AI SDK runtime helper.
- It depends on official shadcn registry primitives through `registryDependencies`, including `utils`, so a fresh consumer project gets the same base-nova source the CLI would install by hand.
- It intentionally keeps only the basic AI Gateway chat contract so the first registry item stays small enough to validate in fresh projects.
- Treat `registry/foundation-chat/` as the reference implementation for future demo registry items unless a later doc explicitly replaces it.
- Consumer-facing install syntax should standardize on a registry namespace:

```bash
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://agent-demos.hsawana9.com/r/{name}.json
pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat
```

## Reusable Success Pattern

Use `foundation-chat` as the reusable pattern for the next registry-backed demo.

1. Start with a working app-first demo slice under `apps/web/features/<demo-slug>/`.
2. Make the slice copy-ready before building sync tooling or expanding registry scope:
   - move env access behind feature-local `env.ts`
   - move UI-facing chat/runtime seams behind feature-local hook or runtime helpers
   - remove monorepo-only imports from files that need a portable registry copy
   - reduce app and registry file differences to one-to-one copies plus a small whitelist of explicit transforms
3. Create a portable registry source under `registry/<demo-slug>/`:
   - keep route entry files thin
   - keep registry source on consumer aliases such as `@/components/ui/*` and `@/lib/*`
   - keep registry-only wiring, vendored exceptions, and generated output under registry ownership
4. Use official shadcn primitives through `registryDependencies` whenever they install cleanly.
5. Vendor only the exceptions that are still broken against the current consumer stack. Current example: `foundation-chat` keeps AI Elements `conversation` and `message` external, but ships its own `prompt-input`.
6. Explicitly declare every runtime package imported by registry-owned files in `dependencies`, even when a nested registry dependency also uses that package.
7. Validate the source registry, build distributable JSON, then prove the install path in a fresh consumer app.
8. When the demo includes server tooling or vendored source copies, verify that copied relative imports still resolve from the consumer target tree.
9. Add author-side sync tooling only after the slice is copy-ready. `foundation-chat` is the first example and is documented in [Registry Sync](./registry-sync.md).

If a new demo fails at step 2, stop there and fix the slice. Do not use registry wiring or sync tooling to cover a tangled boundary.

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
pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://agent-demos.hsawana9.com/r/{name}.json
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

Validated again on May 27, 2026 against a clean local consumer app for the current queue of shipped registry demos:

- `streaming-chat-shell`
- `loop-agent`
- `trace-eval-agent`
- `persistent-agent`
- `sandbox-agent`
- `skills-agent`
- `mcp-agent`

The current acceptance bar for a queue-complete registry batch is:

1. `pnpm dlx shadcn@latest add @ai-sdk-6-demos/<demo-slug>` succeeds in a clean consumer app.
2. `pnpm build` succeeds in that consumer app after all queued items are installed.
3. `pnpm dev` starts successfully.
4. `HEAD /demos/<demo-slug>` returns `200`.
5. A deliberately invalid `POST /api/demos/<demo-slug>` returns the demo's expected request-validation error, currently `400` for the shipped queue.

Recent consumer acceptance exposed these concrete failure classes:

- Missing direct npm dependencies in `dependencies`, even though the producer repo already had them.
- Wrong registry file types for non-code assets.
- Registry-copy relative imports that still assumed the source feature directory shape.
- Page/runtime modules that statically imported route-only heavy dependencies and failed under fresh-consumer Turbopack builds.

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
curl -I http://localhost:3000/demos/<demo-slug>
curl -X POST http://localhost:3000/api/demos/<demo-slug> \
  -H 'content-type: application/json' \
  -d '{"prompt":"hello"}'
```

Do not treat a registry item as finished until the fresh consumer path passes. Validation and build prove schema correctness. The fresh consumer app proves distribution correctness.

## Reusable Checklist

Use this condensed checklist when the next demo starts registry work:

- app-first demo already runs inside `apps/web`
- feature slice is copy-ready
- portable registry source exists under `registry/<demo-slug>/`
- direct npm imports are listed in `dependencies`
- shadcn primitives are listed in `registryDependencies`
- non-code copied files are declared with the correct registry file type
- `pnpm --dir packages/ui exec shadcn registry validate registry.json -c ../..` passes
- `pnpm registry:build` passes
- fresh consumer `shadcn add` install passes
- fresh consumer page probes return `200`
- fresh consumer invalid-body API probes return the expected validation error
- fresh consumer `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm dev` pass
