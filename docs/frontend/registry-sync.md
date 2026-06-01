---
title: Registry Sync
description: Author-side rules for keeping app-first Agent Demos aligned with registry copy boundaries.
updateAt: 2026-06-01
---

# Registry Sync

## Scope

- Covers author-side sync tooling under `scripts/registry-sync/`.
- Covers the preconditions for syncing an app-first Agent Demo into `registry/<demo-slug>/`.
- Covers sync modes, manifest boundaries, and failure rules.

## Domain Language

- **Registry projection Module**: The shared author-side implementation in `scripts/registry-sync/registry-projection.mjs` that checks and writes registry source files from explicit manifests.
- **Registry sync CLI**: The shared command entrypoint at `scripts/registry-sync/sync-registry-demo.mjs`.
- **Registry sync manifest**: A demo-specific mapping file that declares source files, target files, and allowed transforms for one Agent Demo.
- **Copy-ready feature slice**: An app-first demo slice whose registry copy can be derived through one-to-one file mapping plus a small whitelist of explicit transforms.
- **Registry-only file**: A file that belongs to registry wiring or registry-specific vendoring and should stay outside automatic sync.

## Current Rules

- Use app-first ownership for registry-ready demos. `apps/web/features/<demo-slug>/` is the source of truth once that demo is copy-ready.
- Place registry projection tooling under `scripts/registry-sync/`. Use one shared CLI plus one manifest file per sync-ready demo. Demo-specific shell scripts may remain as compatibility wrappers.
- Treat sync tooling as author tooling. Do not place it inside `apps/web/features/<demo-slug>/` or `registry/<demo-slug>/`.
- Only add a sync script after the demo is copy-ready.
- A demo is copy-ready only when all of these are true:
  - app-first files and registry target files have a clear one-to-one mapping
  - file differences are limited to whitelist transforms such as import-path rewrites, alias rewrites, and a small set of fixed literals
  - the registry copy no longer depends on monorepo-only modules or app-only aggregation entrypoints
  - copied files do not rely on source-tree-relative imports that break after the file lands in the consumer target tree
  - the synced registry item still passes registry validation, registry build, and any required fresh-consumer acceptance checks
- Keep the script narrow. It should check and copy already-clean files. It should not rescue a slice whose boundaries are still tangled.
- Keep registry wiring files under registry ownership. `registry/<demo-slug>/registry.json`, route entry files, vendored exception files, and generated files under `apps/web/public/r/` stay outside v1 auto-sync.
- If a synced app-first file imports a shared UI helper that must travel with the registry item, add that helper as an explicit manifest entry and add the projected file to `registry/<demo-slug>/registry.json`. Do not leave the consumer to discover the missing helper at install time.
- Published-site host augmentations such as the [Site Usage Gate](./site-usage-gate.md) must stay outside sync manifests and synced files.
- If an app-first source file imports `site-usage-gate` or other published-site host augmentation modules, that file is not copy-ready for registry sync.
- Registry route entries should call demo runtime handlers directly. Do not sync an app route wrapper that exists only to meter usage on the published website.
- Manifest transforms must be explicit and whitelist-based.
- Unknown imports, unknown path shapes, unknown replacement patterns, or unexpected file drift must cause a hard failure.
- Do not add fuzzy matching, inference, or fallback transforms.
- If a copied file still needs structural edits such as route/runtime splits, delayed heavy imports, or dependency-surface cleanup to survive fresh-consumer builds, stop and fix the feature slice first. Do not hide that problem behind a sync transform.

## Execution Model

- Give every demo two explicit modes:
  - `--check`: inspect mappings and transforms without writing files
  - `--write`: perform the sync and write target files
- Require an explicit mode. Exiting with an error on missing mode is preferred over guessing.
- Use `pnpm registry:sync:check` to run all `scripts/registry-sync/*.manifest.json` projections in check mode.
- Use `pnpm registry:sync:write` to write all declared projections. This command writes registry source files only; it does not build generated public registry output.
- `pnpm registry:check`, `pnpm registry:build`, and `pnpm registry:validate` must run `pnpm registry:sync:check` before checking, building, or validating registry output.
- Public registry JSON under `apps/web/public/r/` is generated output, but it must still be formatter-clean. `pnpm registry:build` runs `pnpm registry:public:format` after shadcn build output, and `pnpm registry:check` runs `pnpm registry:public:check`.
- Demo-specific compatibility scripts may run `pnpm registry:build` automatically after a successful `--write`; `scripts/registry-sync/foundation-chat.sh --write` currently does this.
- Registry projection `--write` may create a new target file when a manifest adds a new projected file. `--check` still fails when that target is missing.
- Do not treat fresh-consumer acceptance as part of the sync script. Keep that as a separate author verification step.
- Fresh-consumer acceptance should still probe both page and API reachability after `pnpm dev` starts, because registry drift often shows up only after route compilation.

## Foundation Chat Reference

- `foundation-chat` is the first working registry baseline and the first planned sync reference.
- Use this document for the general rules.
- Use the live `foundation-chat` files for the concrete example:
  - app-first source: `apps/web/features/foundation-chat/`
  - registry source: `registry/foundation-chat/`
- The current shared sync entrypoint is `scripts/registry-sync/sync-registry-demo.mjs`.
- `scripts/registry-sync/foundation-chat.sh` remains as a compatibility wrapper for the first demo-specific workflow.
- The current v1 sync scope for `foundation-chat` is limited to already-mirrored demo files with one-to-one targets:
  - `ui/foundation-chat-screen.tsx`
  - `ui/foundation-chat-workspace.tsx`
  - `ui/use-foundation-chat.ts`
  - shared UI helper `apps/web/components/demo-breadcrumb.tsx`
  - `server/runtime.ts`
  - `server/env.ts`

Current explicit transform exception:

- `apps/web/components/demo-breadcrumb.tsx` rewrites `@workspace/ui` imports to consumer-project aliases and is listed as a registry item file.
- `server/env.ts` removes the app-only `@/env` import and rewrites the default env reader from `appEnv` to `process.env` for the registry copy.

Minimal author workflow:

```bash
pnpm registry:sync:check
pnpm registry:sync:write
scripts/registry-sync/foundation-chat.sh --check
scripts/registry-sync/foundation-chat.sh --write
```

Expected behavior:

- `--check` exits non-zero when drift exists.
- `--write` syncs the registry source files and then runs `pnpm registry:build`.

Fresh-consumer acceptance remains separate and should currently cover:

```bash
pnpm build
pnpm dev
curl -I http://localhost:3000/demos/<demo-slug>
curl -X POST http://localhost:3000/api/demos/<demo-slug> \
  -H 'content-type: application/json' \
  -d '{"prompt":"hello"}'
```

Expected current contract for shipped demos:

- page probe returns `200`
- invalid-body API probe returns the demo's request-validation error, currently `400`

## Update Triggers

- Update this file when the sync-tooling location changes.
- Update this file when the copy-ready checklist changes.
- Update this file when sync modes, manifest format, or allowed transform boundaries change.
