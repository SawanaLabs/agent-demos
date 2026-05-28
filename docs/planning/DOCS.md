---
title: Planning Knowledge Protocol
description: Domain-level language, reading path, and boundary principles for recoverable planning docs.
updateAt: 2026-05-29
---

# Planning Knowledge Protocol

## Reading Path

- Read this file before adding, editing, pruning, or reorganizing planning docs.
- For recoverable future work across the repository, read [Work Roadmap](./work-roadmap.md) after this file.
- If a planning item becomes concrete domain knowledge, move that knowledge into the relevant domain doc instead of leaving it in planning.

## Domain Language

- **Work Roadmap**: The planning doc for recoverable work intent and intended end states across this repository.
- **Recoverable Work Topic**: A viable future work idea, open direction, or discussion point worth preserving across interruption, attention limits, or sequencing constraints.
- **Intended State**: The required end-state description for a **Recoverable Work Topic**.
- **Discussion**: Optional agreed context from prior discussion, or a concise open question from that discussion that a future agent or teammate should continue from.

## Boundary Principles

- Keep planning docs focused on future work that should remain recoverable across interruption, attention limits, or sequencing constraints.
- Use the **Work Roadmap** when a viable topic should be preserved for later because active parallel work already carries enough cognitive load, or because the topic should wait for another task, decision, validation, environment, or timing condition.
- The **Work Roadmap** does not need to mirror every active parallel task. It only captures work intent that benefits from being parked, resumed, discussed, or handed off later.
- Write planning items as imagined end states or discussion prompts, not as implementation plans.
- Add **Discussion** only after a prior user-agent discussion has produced agreed context or a concrete open question.
- Do not store file-by-file steps, speculative analysis, temporary debugging notes, or session transcripts in planning docs.
- Do not use checkbox-driven status management in the **Work Roadmap**. Its lifecycle is add, refine, and remove.
- Keep **Current Focus** to at most five items. If it grows beyond five, reorganize or remove stale items before adding more.
- Remove completed items from the **Work Roadmap** once the durable result has moved into code, a domain doc, or git history.
- Keep feature-specific checklists in the relevant domain docs, such as `docs/frontend/*`, and use the **Work Roadmap** only as a high-level recovery entry point.

## Update Triggers

- Update this file when the planning domain's scope, item format, or lifecycle rules change.
- Update [Work Roadmap](./work-roadmap.md) when a future work topic should be preserved for later discussion, prioritization, or handoff.
- Update [Planning](./index.md) when planning subdomain files are added, renamed, or removed.
