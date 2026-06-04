---
title: shadcn Registry Distribution
description: Durable rules for packaging Agent Demos as shadcn registry items.
updateAt: 2026-06-04
---

# shadcn Registry Distribution

## Scope

- Covers source registry files under `registry/`.
- Covers generated static registry JSON under `apps/web/public/r/`.
- Covers the public **Registry Export** manifest that decides which registry source chunks ship to consumers.
- Covers how an **Agent Demo** becomes installable into a fresh Next.js App Router project initialized with shadcn/ui.
- Covers the boundary between the public consumer guide at `/registry-guide` and these internal author-side rules.

## Public Consumer Guide

- `/registry-guide` is the public **Registry Guide Page** for **Registry Consumers** who have not forked this repository.
- The public page should be blog-readable but executable: concise setup context, the namespace command, the `foundation-chat` mainline install command, required env vars, agent-facing guidance, and short setup notes for other supported registry demos.
- The public page should use `agent-demos.hsawana9.com` as the production host in commands:

```bash
pnpm dlx shadcn@latest registry add @agent-demos=https://agent-demos.hsawana9.com/r/{name}.json
pnpm dlx shadcn@latest add @agent-demos/foundation-chat
```

- Public copy should link inline to source material such as the GitHub repo, shadcn registry docs, AI SDK docs, and AI Elements docs.
- Keep author maintenance, publishing, sync tooling, and fresh-consumer acceptance details in this internal document instead of duplicating them on `/registry-guide`.
- Homepage registry entry points should stay compact. The current public entry appears on the homepage and points to `/registry-guide`; demo screen-level install hints are planned separately.
- The public page's coding-agent handoff should optimize for a new-project mainline. Trust a capable user-directed agent to recognize when the user is already inside an existing project, but do not expand the public handoff copy around that side path.
- The coding-agent handoff should be a copyable task brief, not a compressed tutorial. It should name the user's goal, point the agent to `https://agent-demos.hsawana9.com/registry-guide` as the source of truth before planning, and list acceptance criteria such as initialized shadcn Next.js app, Foundation Chat installed from `@agent-demos`, local chat verified with `AI_GATEWAY_API_KEY`, and Vercel env prepared.
- Use a visible handoff title like "Hand this guide to your agent" so the page frames the prompt as a guide-backed task brief instead of a standalone path summary.
- Generate the visible handoff URL from the registry guide config instead of hard-coding it inside the page component, so future host changes update registry commands and the agent prompt together.
- Treat coding-agent-assisted adaptation as part of the consumer story. A Registry Consumer may install a demo into a new or existing project, give the installed source plus linked docs to their coding agent, and ask that agent to adapt routes, styling, data services, or provider settings to the host project.

## Current Rules

- Keep `registry/registry-demos.json` as the public registry manifest. It is the source of truth for registry namespace, production domain, public demo order, mainline guide demo, setup notes, and whether a demo enters the public **Registry Export**.
- Keep `registry/registry-demos.json` as the source of truth for **Registry Availability** too. Every ready **Demo Catalog Entry** must either appear in `demos` or appear in `omittedReadyDemos` with a reason.
- The long-term distribution target is the full demo catalog, not only the current public registry subset. `publicRegistry: false` and `omittedReadyDemos` describe current packaging readiness, not a permanent product boundary.
- Minimum distributability means the registry command installs a complete reference implementation into a fresh shadcn Next.js project, the installed project compiles and runs, the item carries its required env examples, runtime files, UI files, route files, and docs or source links, and the demo happy path works after the declared services are configured. Host-project adaptation such as route naming, database provider choice, auth, deployment environment, or styling integration is expected to be handled by the Registry Consumer's coding agent with the installed source and linked docs.
- Use `apps/web/features/demo-catalog/registry-availability.ts` as the join module between **Demo Catalog Entry** data and the **Registry Export** manifest. The join fails when a registry demo is missing from the catalog, when a registry demo points at a roadmap entry, or when a ready demo has no registry availability classification.
- Generate the root `registry.json` from `registry/registry-demos.json` with `pnpm registry:generate`; do not hand-edit the root `include` list.
- Keep `registry.json` as the generated root source registry that composes public demo-owned registries with `include`.
- Put one demo's portable registry source under `registry/<demo-slug>/`.
- Build static registry output with `pnpm registry:build`; the output is served by the web app from `/r/<name>.json`.
- Treat `pnpm registry:build` as a packaging step only. It turns source `registry.json` files into distributable JSON. It does not derive registry source files from `apps/web/features/*`.
- `pnpm registry:build` regenerates the root `registry.json`, removes stale generated public JSON files that are no longer in the manifest's public set, then runs `shadcn build`.
- `pnpm registry:catalog:check` runs the **Registry Availability** contract test against current demo catalog data and the registry manifest. `registry:check`, `registry:validate`, and `registry:build` all run this before generating or validating registry output.
- Keep demo source chunks such as `registry/skills-agent/` even when `publicRegistry` is `false`; unpublished chunks are local author work until their fresh-consumer acceptance checks pass.
- Treat the registry source as a portable copy boundary, not a direct mirror of `apps/web/features/<demo-slug>`.
- Keep every file referenced by a demo-owned `registry/<demo-slug>/registry.json` inside that registry chunk directory. Current shadcn CLI validation rejects parent-directory traversal such as `../feature.tsx`, so a registry item cannot point straight at app feature files outside its owned tree.
- For synced app-first demos, every manifest target under `registry/<demo-slug>/` is treated as a shipped file unless the manifest explicitly sets `registryItemFile: false`. The sync check asserts that each shipped target is present in `registry/<demo-slug>/registry.json` `files[].path`.
- Shared registry assets are projected by `scripts/registry-sync/shared-registry-assets.json` into every source chunk listed by `registry/registry-demos.json`, or into an explicit source-chunk subset when an entry declares `demos`. This keeps each installed demo self-contained while giving shared portable files one author-side owner.
- Keep registry-only shared vendored assets under `registry/_shared/`, then project them into demo chunks. Do not reference `registry/_shared/` directly from a demo-owned `registry.json`.
- Registry source must not import `@workspace/*` packages or `apps/web/features/shared/*` modules.
- Registry source must not import published-site host augmentations such as the [Site Usage Gate](./site-usage-gate.md), and must not include usage-limit dialogs, access-code redemption, or website-only visitor metering.
- If this published website wraps an app API route with the **Site Usage Gate**, the matching registry route entry should still call the portable demo runtime handler directly.
- If an app-first screen uses the **Demo Workspace Shell**, the registry item should install the projected `components/demo-workspace-shell.tsx` plus its projected `components/demo-breadcrumb.tsx` dependency through the shared registry asset manifest. Keep screen files thin and avoid re-copying page chrome in each synced demo.
- Registry source should import shadcn and AI Elements code through consumer-project aliases such as `@/components/ui/*`, `@/components/ai-elements/*`, and `@/lib/*`.
- Use `files[].target` placeholders such as `@components/` and `@lib/` for files that can follow the consumer project's `components.json`.
- Next.js route targets still need explicit `app/...` paths because shadcn registry target aliases do not provide an App Router placeholder.
- Prefer `registryDependencies` for shadcn primitives and support modules such as `utils`. In a `base-*` consumer project, plain names like `button`, `tooltip`, and `utils` resolve against the official shadcn registry for the active style.
- Registry-owned demo shell components should inherit the consumer project's shadcn language. Compose `button`, `badge`, `card`, `textarea`, theme tokens, and related primitives instead of hard-coding top-level panel geometry or writing local styling that overrides the preset's default radius and border character without a clear product reason.
- Registry-owned demo components must target the public contract of the official shadcn primitive they declare in `registryDependencies`. Do not rely on workspace-local extensions such as extra slot exports or child composition APIs unless the registry item vendors that primitive itself.
- Finish the consumer project's own `pnpm dlx shadcn@latest init` flow before installing any demo item. That step installs the base preset dependencies behind official primitives such as `button`, including `@base-ui/react` and `class-variance-authority`.
- Every public demo registry item must support standalone direct install after only the namespace setup command. Do not require a Registry Consumer to install `foundation-chat` or any other demo first. Shared runtime, shell, AI Elements, or AI Gateway files needed by multiple demos must be included by that demo's registry item, usually through the shared registry asset projection.
- Use external AI Elements registry URLs in `registryDependencies` when they install cleanly. `foundation-chat` keeps `conversation` and `message` external, but ships its own `prompt-input` because the upstream registry version currently fails TypeScript checks against the current shadcn/Base UI stack.
- Explicitly list every package imported by registry-owned files in `dependencies`. Keep the consumer host contract narrow and documented, then let the package manager resolve duplicates.
- Treat fresh consumer acceptance as the final dependency-closure check. In the current CLI flow, nested `registryDependencies` did not reliably pull every transitive npm package into a clean consumer app, so each demo item must still declare the runtime packages its installed files need.
- When registry-owned files import non-TypeScript assets or support files such as `.md`, `.yaml`, `.py`, `.png`, or `.svg`, declare those entries as `registry:file`. Do not mark them as `registry:lib`, because `shadcn add` may try to parse them as code during transforms.
- Keep page-facing runtime state seams shallow. If a demo page only needs setup state, do not let its imported runtime module statically pull route-only chat/tool dependencies into the Server Component build graph.
- For demos that use `bash-tool`, `just-bash`, or other heavy route-only packages, prefer a split between page-facing runtime state and request handling, and prefer delayed imports for the heavy server path so a fresh consumer `pnpm build` does not fail under Next.js 16 Turbopack.
- Registry copies must be valid from the consumer target path, not just from the source feature path. Relative imports that work under `apps/web/features/<demo-slug>/...` may break after files move into `components/<demo-slug>/` or `lib/<demo-slug>/`.
- Use `envVars` only for local development examples such as `AI_GATEWAY_API_KEY`; do not encode production secrets or production-only values.
- Registry env adapters may read `process.env` directly from `env.ts` or `env-source.ts` files because installed registry source belongs to the consumer app and does not have this repo's `@/env` wrapper.
- Do not add `@t3-oss/env-nextjs` to ordinary demo registry items just to mirror the app preview's env stack. Registry `dependencies` can install npm packages, but an env management library changes the consumer host contract. Ship it only from an explicit base or template registry item whose purpose is to install that env architecture.
- When app-first code uses `apps/web/env.ts`, `keys.ts`, or a shared env adapter, split the portable runtime contract from the app adapter before registry projection. The registry copy should install a registry env adapter that feeds `process.env` into the same contract.
- Shared AI Gateway demos should install the portable contract at `@/lib/ai-gateway/contract`. Demo-owned `env.ts` files should import that contract, while demo-owned `env-source.ts` files should read the consumer app's `process.env`. Keep app-only `@/env`, `keys.ts`, and `@t3-oss/env-nextjs` out of ordinary demo registry items.
- Do not hand-edit generated files under `apps/web/public/r/`. Rebuild them from source registry files with `pnpm registry:build`.

## Source Ownership

- `shadcn build` and the producer-side `shadcn/registry` loaders both consume source registry files. They solve distribution. They do not remove the need for a maintained source registry tree.
- This means the repo still needs an explicit ownership model for demo preview code versus registry source code. Current `foundation-chat` keeps an app preview implementation and a registry implementation because the registry copy uses consumer-project aliases and cannot import workspace-only modules.
- During fresh-consumer registry acceptance, prefer fixing the portable registry source, demo registry manifest, shared registry assets, or sync tooling before touching the working `apps/web` demo preview. Escalate before changing `apps/web` solely to satisfy a consumer install issue.
- The current preferred ownership model is app-first plus explicit sync, once a demo is copy-ready under [Registry Sync](./registry-sync.md).
- Keep per-demo sync tooling under `scripts/registry-sync/`.
- Keep registry-only wiring files under registry ownership even in an app-first model. That includes `registry/<demo-slug>/registry.json`, route-entry files, vendored exception files, and generated output under `apps/web/public/r/`.
- If a demo is not copy-ready yet, fix the slice before introducing sync tooling. Do not use sync as a workaround for a tangled boundary.
- Once a sync manifest exists, treat `files[]` as the distribution contract and the manifest as the projection contract. Keep both updated in the same change when a synced file is added or removed.
- Until a sync step exists for a given demo, update the app preview files and the registry source files in the same change and verify both paths.
- For portable assets shared by many demo chunks, or shared by a selected subset of chunks, prefer the shared registry asset manifest over repeating the file in each demo-specific sync manifest.
- Direct standalone install remains the acceptance boundary even when shared registry assets are projected into many demo chunks. The consumer should be able to replace the guide's `foundation-chat` command with any public demo command and still receive a complete copy for that demo.

## Foundation Chat Item

- `foundation-chat` is the first registry block and proves the minimum installable demo shape.
- It installs a page route, API route, feature component pair, and AI SDK runtime helper.
- It depends on official shadcn registry primitives through `registryDependencies`, including `utils`, so a fresh consumer project gets the same base-nova source the CLI would install by hand.
- It intentionally keeps only the basic AI Gateway chat contract so the first registry item stays small enough to validate in fresh projects.
- Treat `registry/foundation-chat/` as the reference implementation for future demo registry items unless a later doc explicitly replaces it.
- Consumer-facing install syntax should standardize on a registry namespace:

```bash
pnpm dlx shadcn@latest registry add @agent-demos=https://agent-demos.hsawana9.com/r/{name}.json
pnpm dlx shadcn@latest add @agent-demos/foundation-chat
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
- Include any shared portable contract files explicitly, such as `lib/ai-gateway/contract.ts` with target `@lib/ai-gateway/contract.ts`, before the demo env adapter that imports them.
- If the file is shared across registry chunks or a named subset of chunks, add it to `scripts/registry-sync/shared-registry-assets.json` and keep the per-demo `registry.json` `files[]` entries aligned through `pnpm registry:sync:check`.

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
pnpm dlx shadcn@latest registry add @agent-demos=https://agent-demos.hsawana9.com/r/{name}.json
pnpm dlx shadcn@latest add @agent-demos/foundation-chat
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
- `mcp-agent`

`skills-agent`, `langgraph-agent`, and `ultra-chatbot-agent` have since entered the public **Registry Export** after fresh-consumer packaging work.

The current ready demos explicitly omitted from registry source are:

- `openai-agents-sdk-demo`: needs the OpenAI Agents SDK backend bridge converted into a portable registry copy.

`langgraph-agent` is intentionally published as **Frontend slice distribution**: the registry item installs the Next.js page, route proxy, UI, and adapter runtime, while the Python LangGraph backend stays a separate service that the Registry Consumer runs locally or deploys from `apps/langgraph-agent-api`.

`ultra-chatbot-agent` is intentionally published as a complete full-stack registry item. The install ships the workspace shell, route-backed chat APIs, model selector, history, voting, documents, Blob upload route, RAG-backed knowledge search, Project Docs MCP route, gated sandbox tools, cleanup cron, Drizzle schema, and setup notes. AI Gateway, Postgres, and Redis are required for the main happy path. Blob and Vercel Sandbox credentials belong to Ultra's core capability set and should be configured when validating uploads or sandbox execution.

The current acceptance bar for a queue-complete registry batch is:

1. `pnpm dlx shadcn@latest add @agent-demos/<demo-slug>` succeeds in a clean consumer app.
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
pnpm registry:sync:check
pnpm registry:catalog:check
pnpm registry:validate
pnpm registry:build
```

Then verify in a fresh consumer app:

```bash
pnpm dlx shadcn@latest init --preset b0 --template next
cd <your-app>
pnpm i
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest registry add @agent-demos=http://localhost:3000/r/{name}.json
pnpm dlx shadcn@latest add @agent-demos/<demo-slug>
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

Run fresh-consumer acceptance in two layers. During author work, install from a local served registry URL such as `http://localhost:3000/r/{name}.json` so unpublished registry source can be fixed quickly. Before claiming the user-facing guide path works, repeat the same flow against `https://agent-demos.hsawana9.com/r/{name}.json` after deployment.

Use one clean consumer project per demo for the primary acceptance check. Do not require or rely on a consumer project that installs multiple demo registry items in sequence. Multi-demo install compatibility is a separate optional audit, not part of the per-demo direct-install standard.

Run registry verification as one vertical demo loop at a time. If a demo fails fresh-consumer acceptance, fix that demo to passing before starting the next demo, then commit that completed demo slice separately. Avoid broad queue-first audits that turn one shared registry failure into repeated noise across many demos.

Use the current simple-to-complex verification order: `foundation-chat`, `multimodal-chatbot`, `object-generation`, `streaming-chat-shell`, `loop-agent`, `mcp-agent`, `trace-eval-agent`, `rag-chatbot`, `customer-memory-agent`, `persistent-agent`, `sandbox-agent`, `skills-agent`, `langgraph-agent`, then `ultra-chatbot-agent`. This order prioritizes AI-Gateway-only demos with smaller state surfaces before database, Redis, external backend, Blob, MCP, RAG, and Vercel Sandbox-backed demos.

For AI-Gateway-only registry demos, the fresh-consumer happy path must include a browser-level interaction after `AI_GATEWAY_API_KEY` is configured: open the installed demo page, click the first suggestion, and verify that the UI completes a visible assistant response. API route smoke checks are supporting evidence only; they do not replace the page-level suggestion flow.

For this registry-verification phase, browser-level E2E means a human-style Codex in-app Browser check against the running fresh consumer dev server. CLI automation may create the consumer app, install the registry item, configure env, start the server, and collect logs, but the acceptance interaction itself is performed through the browser: open the demo page, click the first suggestion, observe the visible response, and inspect obvious UI/runtime failures.

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
- AI-Gateway-only demo: fresh consumer browser flow clicks the first suggestion and receives a visible assistant response
