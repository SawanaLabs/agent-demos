---
name: project-docs-system
description: Bootstrap, audit, or maintain a repository-specific project docs system centered on `AGENTS.md` and `docs/`, including `docs/DOCS.md`, `docs/index.md`, domain index files, and subdomain docs. Use for any agent (such as Codex, Claude Code, and OpenClaw) when it needs to initialize docs files, maintain two-level docs maps, add or update project conventions, capture durable non-obvious practices, or sync AGENTS.md docs-system rules.
---

# Project Docs System

Build and maintain a layered docs system so future work can reuse durable project knowledge without collapsing everything into one file.

## Design Philosophy

This docs system borrows from Domain-Driven Design: organize durable knowledge around project domains and bounded contexts, keep shared vocabulary explicit, and place each convention where its scope belongs. `docs/DOCS.md` is the repository knowledge protocol for cross-domain language, collaboration conventions, and boundary principles; index files act as a context map, and leaf docs capture stable knowledge inside one focused subdomain. Do not force tactical DDD patterns into the docs unless the project itself uses them.

## Follow This Workflow

1. Inspect the current docs state.
   - Read `AGENTS.md`, `docs/DOCS.md`, and `docs/index.md` if they exist.
   - If `docs/index.md` exists, read relevant `docs/<domain>/index.md` files before editing leaf docs.
   - Treat `docs/` as initialized only when compatible `docs/DOCS.md` (Project Knowledge Protocol) and `docs/index.md` files exist.
   - Detect whether the repository already has a docs convention and preserve it when possible.

2. Use the canonical layout in [references/docs-layout.md](./references/docs-layout.md).
   - Create or maintain the core files.
   - Keep file roles distinct.
   - Reuse the standard frontmatter keys and section layout.
   - When creating a new leaf doc, copy the structure in [references/subdomain-doc-template.md](./references/subdomain-doc-template.md).

3. Sort knowledge before writing.
   - Put cross-domain language, collaboration conventions, and boundary principles in `docs/DOCS.md`.
   - Put domain navigation in `docs/<domain>/index.md`.
   - Put stable subdomain knowledge in `docs/<domain>/<subdomain>.md`.
   - Add a `## Domain Language` section only when a docs file depends on confirmed project-specific terms.
   - Do not store short-lived debugging notes or one-off session details.

4. Keep `AGENTS.md` as the entry point.
   - If `docs/` is initialized, ensure `AGENTS.md` includes this exact rules block:

```md
<!-- BEGIN:docs-system-rules -->
# This is NOT the docs system you know

This repository maintains project-specific knowledge and conventions in `docs/`; start with `docs/index.md` and `docs/DOCS.md`, then follow links into `docs/<domain>/index.md` and `docs/<domain>/<subdomain>.md` as needed, treat `docs/` as the source of durable non-obvious project practices, and use the installed `$project-docs-system` skill when initializing, maintaining, or updating this docs system.
<!-- END:docs-system-rules -->
```

   - If `docs/` is not initialized yet, do not add the rules block yet.

5. Keep maps complete.
   - When adding, renaming, merging, or removing `docs/<domain>/<subdomain>.md` files, update `docs/<domain>/index.md` in the same change.
   - When adding, renaming, merging, or removing first-level domains, update `docs/index.md` in the same change.

6. Update docs during normal work, not as an afterthought.
   - After a user correction, update the relevant docs file in the same task when possible.
   - After a new module or workflow appears, add or extend the relevant domain and subdomain docs.
   - Prefer short, durable bullets over long narrative notes.

## Editing Rules

- Preserve the repository's chosen freshness key if one already exists.
- When bootstrapping a new system from scratch, use the frontmatter keys in [references/docs-layout.md](./references/docs-layout.md).
- Keep docs files scoped and stable; move repeated cross-domain knowledge up into `docs/DOCS.md`.
- Keep `## Domain Language` short: use one-sentence definitions, optional `_Avoid_: ...`, and optional `Related: ...`; skip the section when no confirmed terms are needed.
- Reference concrete files, routes, or modules when that makes the docs more reusable.

## Final Check

- Confirm the core docs files exist and are linked together.
- Confirm every docs document starts with frontmatter.
- Confirm `docs/index.md` covers every first-level domain.
- Confirm each `docs/<domain>/index.md` covers every `docs/<domain>/<subdomain>.md` file.
- Summarize what was created or updated and why.
