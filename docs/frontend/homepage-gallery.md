---
title: Homepage Gallery
description: Durable conventions for the homepage surface that presents agent demos.
updateAt: 2026-05-25
---

# Homepage Gallery

## Scope

- Covers the homepage presentation model for `apps/web/app/page.tsx`.
- Covers how agent demos should appear to technical evaluators before they open an individual demo.

## Domain Language

- **Gallery card**: A designed homepage card that presents one demo catalog entry through a title and concise visual summary.
- **Gallery visual**: A stylized product-metaphor asset, often generated with AI, that visually summarizes one demo's agent behavior.
- **ASCII gallery visual**: A gallery visual body rendered as final monospace ASCII art inside a fixed 16:9 region.

## Current Subdomain Docs

- Shape the homepage as a demo gallery for technical evaluators.
- Present each ready agent demo as an active gallery card.
- Present roadmap demos as visible but non-active roadmap cards.
- The homepage catalog derives ready and roadmap groups from feature-local `demo-meta.ts` files.
- Each gallery card should make the agent pattern legible through its title and a concise product-metaphor visual.
- Store ASCII gallery visual content in the matching feature-local `demo-meta.ts` entry, alongside `galleryVisual.label` and `galleryVisual.accent`.
- Prefer ASCII gallery visuals as the final visual language for the homepage cards, not as placeholder sketches.
- Keep ASCII gallery visuals unified through shared character aesthetics, fixed 16:9 framing, and the existing multi-accent color system, while allowing each demo to use its own composition.
- Keep gallery visual metadata, such as the visual label and agent pattern, outside the ASCII gallery visual body.
- Avoid readable words inside the ASCII gallery visual body by default; reserve that space for rare brand wordmarks or stylized letterforms when a demo needs a stronger identity cue, such as the OpenAI Agents SDK Demo.
- Structural symbols such as braces, brackets, cursors, dots, connector lines, and terminal-like marks are allowed inside the ASCII gallery visual body.
- Replace the existing process-step boxes with a fixed 16:9 monospace region when the card needs a stronger product-metaphor image.
- Use Foundation Chat, RAG Chatbot, Multi-Modal Chatbot, Object Generation, Memory & Persistence Agent, Persistent & Resume Agent, Streaming Chat Shell, Loop Agent, Skills Builder Agent, Sandbox Workspace Agent, MCP Runtime Doctor Agent, OpenAI Agents SDK Demo, and Trace and Eval Agent as the first accepted ASCII gallery visual pilots; keep other demos on the migration step-box rendering until their ASCII compositions are discussed and accepted one by one.
- Do not preserve step boxes as a long-term fallback once every demo has an ASCII gallery visual, because they weaken the visual metaphor and make the catalog model harder to understand.
- Keep each ASCII gallery visual tied to the demo's agent behavior, such as a textless chat-surface silhouette for a foundation chat demo, instead of generic decoration.
- Do not make the homepage a generic personal portfolio or a long documentation index.

## Update Triggers

- Update this file when the homepage presentation model changes.
- Update this file when demo status rules affect what appears in the gallery.
