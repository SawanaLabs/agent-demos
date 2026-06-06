# Docs Layout

## Canonical File Set

Use this layout when bootstrapping or repairing a project docs system:

- `AGENTS.md`
  - Keep this as the agent entry point.
  - If `docs/` is initialized, include the docs-system rules block.
  - If `docs/` is not initialized, defer adding the block.
- `docs/DOCS.md`
  - Act as the repository knowledge protocol.
  - Store cross-domain language, collaboration conventions, and boundary principles.
  - Store repo-wide decision records only when the decision affects multiple domains.
- `docs/index.md`
  - Act as the map for first-level domains.
- `docs/<domain>/DOCS.md`
  - Store domain-level language, conventions, and boundary principles shared by multiple subdomain docs.
  - Store domain-wide decision records only when the decision affects multiple subdomain docs.
- `docs/<domain>/index.md`
  - Act as the map for second-level docs in one domain.
- `docs/<domain>/<subdomain>.md`
  - Store durable knowledge that only applies to one subdomain.
  - Store subdomain-specific decision records in an optional `## Decision Records` section.

## AGENTS Rules Block

Treat `docs/` as initialized only when compatible `docs/DOCS.md` (Project Knowledge Protocol) and `docs/index.md` files exist. When initialized, ensure `AGENTS.md` includes this exact block:

```md
<!-- BEGIN:docs-system-rules -->
# This is NOT the docs system you know

This repository maintains project-specific knowledge and conventions in `docs/`; start with `docs/index.md` and `docs/DOCS.md`, then follow links into `docs/<domain>/DOCS.md`, `docs/<domain>/index.md`, and `docs/<domain>/<subdomain>.md` as needed, treat `docs/` as the source of durable non-obvious project practices, and use the installed `$project-docs-system` skill when initializing, maintaining, or updating this docs system.
<!-- END:docs-system-rules -->
```

## Frontmatter

Every docs document should start with frontmatter. When creating a new system, use at least:

```yaml
---
title: Example Title
description: One-line description of what this docs file covers.
updateAt: YYYY-MM-DD
---
```

## File Roles

### `docs/DOCS.md`

Store:

- durable cross-domain terminology and confirmed meanings
- collaboration conventions that affect multiple domains
- boundary principles for ownership, responsibility, or placement
- recurring user preferences that affect many tasks
- architectural expectations that show up repeatedly
- repo-wide decision records that are hard to reverse, surprising without context, and based on real trade-offs

Avoid:

- domain-specific implementation notes
- unconfirmed or speculative terminology
- temporary debugging observations
- one-off task status

Use this default structure when bootstrapping:

```md
# Project Knowledge Protocol

## Domain Language

- **Term**: One-sentence definition.
  _Avoid_: ambiguous or rejected names
  Related: **OtherTerm**

## Collaboration Conventions

- Durable project-wide conventions that affect multiple domains.

## Boundary Principles

- Cross-domain ownership, responsibility, or placement rules.
```

### `docs/index.md`

Include:

- a short usage note
- one entry per first-level domain
- when to consult each domain

Use this minimal map template:

```md
# Docs Index

## Domains

- [Domain Name](./domain/index.md): When to consult this domain.
```

### `docs/<domain>/DOCS.md`

Store domain-level language, conventions, boundary principles, and decision records shared by multiple subdomain docs.

### `docs/<domain>/index.md`

Include:

- a short usage note for that domain
- one entry per `docs/<domain>/<subdomain>.md`
- when to consult each subdomain doc

Use this minimal map template:

```md
# Domain Name

## Subdomains

- [Subdomain Name](./subdomain.md): When to consult this doc.
```

### `docs/<domain>/<subdomain>.md`

Store:

- optional `## Domain Language` terms needed to understand this doc
- subdomain-specific conventions
- ownership boundaries
- stable file or route relationships
- user corrections that only matter in that subdomain
- optional `## Decision Records` entries for decisions scoped to this subdomain

Prefer one clear subdomain per file, such as:

- `docs/frontend/routing.md`
- `docs/frontend/data-fetching.md`
- `docs/backend/api-contracts.md`
- `docs/backend/auth-flow.md`

## Decision Records

Add a `## Decision Records` section only when a decision meets all three conditions:

- It is hard to reverse.
- It would surprise a future reader without context.
- It came from a real trade-off between meaningful options.

Default to one lightweight bullet:

```md
## Decision Records

- **YYYY-MM-DD short-decision-slug**: One-sentence summary of the scoped decision.
  Status: One of `Proposed`, `Accepted`, `Rejected`, `Deprecated`, or `Superseded by YYYY-MM-DD short-decision-slug`.
  Context: Why this decision came up.
  Decision: The chosen path.
  Consequences: The main cost, constraint, or follow-up.
```

Use the date when the decision is first recorded. Keep the slug lowercase kebab-case and stable for future references. Pick one status value, not the whole list.

Keep the record at the same scope as the decision:

- Repo-wide decisions belong in `docs/DOCS.md`.
- Domain-wide decisions belong in `docs/<domain>/DOCS.md`.
- Subdomain decisions belong in `docs/<domain>/<subdomain>.md`.

Preserve final decision records as history. If the decision changes, update status or add a superseding record instead of rewriting the old rationale. If decision records become too many or cross-cutting for scoped docs, promote them into a normal docs domain: `docs/adr/DOCS.md`, `docs/adr/index.md`, and `docs/adr/<slug>.md`.

## Placement Rules

Use this decision rule before writing:

- If knowledge should apply across the repository, put it in `docs/DOCS.md`.
- If knowledge is shared by multiple subdomain docs inside one domain, put it in `docs/<domain>/DOCS.md`.
- If a confirmed project-specific term is needed in one docs file, put it in that file's optional `## Domain Language` section.
- If a decision record is needed, put it in the docs file matching the decision scope.
- If it maps first-level navigation, put it in `docs/index.md`.
- If it maps second-level navigation, put it in `docs/<domain>/index.md`.
- If it only matters for one subdomain, put it in `docs/<domain>/<subdomain>.md`.
- If it is too temporary to help future work, do not store it.

## Update Triggers

Update the relevant docs file when:

- the user corrects the agent
- the user clarifies a stable project convention
- a new module, route, feature, or workflow becomes important enough to remember
- an existing domain or subdomain changes ownership, structure, or boundaries

Also update map files whenever docs files change:

- Update `docs/<domain>/index.md` when its subdomain files change.
- Update `docs/index.md` when first-level domains change.

## Verification Helper

When shell access is available and structure has changed, optionally run the bundled [scripts/verify-docs-system.sh](../scripts/verify-docs-system.sh) with the target repo root or `docs/` directory to verify the minimum docs-system contract.
