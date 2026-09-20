---
title: Subdomain Doc Template
description: Reference template for creating a subdomain doc file under docs/<domain>/.
updateAt: YYYY-MM-DD
---

# Subdomain Doc Template

## How To Use

- Copy this structure when creating a new `docs/<domain>/<subdomain>.md` file.
- Replace placeholder wording with concrete, durable project knowledge.
- Keep the scope limited to one subdomain, module surface, workflow, or route cluster.
- Delete the `Domain Language` section when no confirmed project-specific terms are needed.
- When there is decision history, keep it in an adjacent `<stem>.adr.md` and add `[Decision history](./<stem>.adr.md)` here. Do not create an empty companion.
- Move knowledge shared by multiple subdomain docs into `docs/<domain>/DOCS.md`; move cross-domain knowledge up into `docs/DOCS.md`.

## Scope

- Describe exactly what this doc file covers.
- Name the main files, directories, routes, APIs, or runtime surfaces involved.

## Domain Language

- **Term**: One-sentence definition.
  _Avoid_: ambiguous or rejected names
  Related: **OtherTerm**

## Current Subdomain Docs

- Record stable facts that are easy to forget and useful to reuse later.
- Record user corrections, conventions, ownership boundaries, and architectural expectations.
- Prefer short bullets with concrete references when that improves reuse.

## Update Triggers

- Update this file when the user corrects the agent about this subdomain.
- Update this file when the subdomain structure, conventions, responsibilities, or key files change.
- Update this file when a new recurring rule or durable insight appears in this subdomain.
- Update current behavior when it actually changes; preserve decision rationale in the linked companion.
