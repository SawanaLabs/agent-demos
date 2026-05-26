---
title: Registry Sync
description: Author-side rules for keeping app-first Agent Demos aligned with registry copy boundaries.
updateAt: 2026-05-26
---

# Registry Sync

## Scope

- Covers author-side sync tooling under `scripts/registry-sync/`.
- Covers the preconditions for syncing an app-first Agent Demo into `registry/<demo-slug>/`.
- Covers sync modes, manifest boundaries, and failure rules.

## Domain Language

- **Registry sync script**: A demo-specific authoring script that checks or writes a registry source copy from an app-first feature slice.
- **Registry sync manifest**: A demo-specific mapping file that declares source files, target files, and allowed transforms for one Agent Demo.
- **Copy-ready feature slice**: An app-first demo slice whose registry copy can be derived through one-to-one file mapping plus a small whitelist of explicit transforms.
- **Registry-only file**: A file that belongs to registry wiring or registry-specific vendoring and should stay outside automatic sync.

## Current Rules

- Use app-first ownership for registry-ready demos. `apps/web/features/<demo-slug>/` is the source of truth once that demo is copy-ready.
- Place per-demo sync tooling under `scripts/registry-sync/`, using one shell script plus one manifest file per demo.
- Treat sync tooling as author tooling. Do not place it inside `apps/web/features/<demo-slug>/` or `registry/<demo-slug>/`.
- Only add a sync script after the demo is copy-ready.
- A demo is copy-ready only when all of these are true:
  - app-first files and registry target files have a clear one-to-one mapping
  - file differences are limited to whitelist transforms such as import-path rewrites, alias rewrites, and a small set of fixed literals
  - the registry copy no longer depends on monorepo-only modules or app-only aggregation entrypoints
  - the synced registry item still passes registry validation, registry build, and any required fresh-consumer acceptance checks
- Keep the script narrow. It should check and copy already-clean files. It should not rescue a slice whose boundaries are still tangled.
- Keep registry wiring files under registry ownership. `registry/<demo-slug>/registry.json`, route entry files, vendored exception files, and generated files under `apps/web/public/r/` stay outside v1 auto-sync.
- Manifest transforms must be explicit and whitelist-based.
- Unknown imports, unknown path shapes, unknown replacement patterns, or unexpected file drift must cause a hard failure.
- Do not add fuzzy matching, inference, or fallback transforms.

## Execution Model

- Give every demo two explicit modes:
  - `--check`: inspect mappings and transforms without writing files
  - `--write`: perform the sync and write target files
- Require an explicit mode. Exiting with an error on missing mode is preferred over guessing.
- Run `pnpm registry:build` automatically after a successful `--write`.
- Do not treat fresh-consumer acceptance as part of the sync script. Keep that as a separate author verification step.

## Foundation Chat Reference

- `foundation-chat` is the first working registry baseline and the first planned sync reference.
- Use this document for the general rules.
- Use the live `foundation-chat` files for the concrete example:
  - app-first source: `apps/web/features/foundation-chat/`
  - registry source: `registry/foundation-chat/`
- The current v1 sync entrypoint is `scripts/registry-sync/foundation-chat.sh`.
- The current v1 sync scope for `foundation-chat` is limited to already-mirrored demo files with one-to-one targets:
  - `ui/foundation-chat-screen.tsx`
  - `ui/foundation-chat-workspace.tsx`
  - `ui/use-foundation-chat.ts`
  - `server/runtime.ts`
  - `server/env.ts`

Current explicit transform exception:

- `server/env.ts` removes the app-only `@/env` import and rewrites the default env reader from `appEnv` to `process.env` for the registry copy.

Minimal author workflow:

```bash
scripts/registry-sync/foundation-chat.sh --check
scripts/registry-sync/foundation-chat.sh --write
```

Expected behavior:

- `--check` exits non-zero when drift exists.
- `--write` syncs the registry source files and then runs `pnpm registry:build`.

## Update Triggers

- Update this file when the sync-tooling location changes.
- Update this file when the copy-ready checklist changes.
- Update this file when sync modes, manifest format, or allowed transform boundaries change.
