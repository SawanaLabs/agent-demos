---
title: Homepage Gallery
description: Durable conventions for the homepage surface that presents agent demos.
updateAt: 2026-05-22
---

# Homepage Gallery

## Scope

- Covers the homepage presentation model for `apps/web/app/page.tsx`.
- Covers how agent demos should appear to technical evaluators before they open an individual demo.

## Domain Language

- **Gallery card**: A designed homepage card that presents one demo catalog entry through a title and concise visual summary.
- **Gallery visual**: A stylized product-metaphor asset, often generated with AI, that visually summarizes one demo's agent behavior.

## Current Subdomain Docs

- Shape the homepage as a demo gallery for technical evaluators.
- Present each ready agent demo as an active gallery card.
- Present roadmap demos as visible but non-active roadmap cards.
- The current homepage catalog has one ready demo, `foundation-chat`, and four roadmap demos: `rag-chatbot`, `loop-agent`, `skills-agent`, and `sandbox-agent`.
- Each gallery card should make the agent pattern legible through its title and a concise product-metaphor visual.
- A gallery visual can use simple diagram-like content, such as a loop flow for a loop agent, while still being a stylized asset.
- Defer the exact visual style until the project chooses an art direction.
- Do not make the homepage a generic personal portfolio or a long documentation index.

## Update Triggers

- Update this file when the homepage presentation model changes.
- Update this file when demo status rules affect what appears in the gallery.
