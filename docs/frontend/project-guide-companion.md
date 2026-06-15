---
title: Project Guide Companion
description: Site-owned companion chatbot boundary, page visibility policy, session history policy, model selector, and Project Docs MCP answer surface.
updateAt: 2026-06-16
---

# Project Guide Companion

## Scope

- Covers the site-owned chatbot companion for answering project-docs questions.
- Covers where the companion appears across homepage, registry guide, demo workspaces, and status/error surfaces.
- Covers the boundary that keeps the companion outside Agent Demo copy boundaries and shadcn registry distribution.
- Covers the relationship between companion suggestions and the broader Project Docs MCP answer surface.
- Covers the browser-session conversation history policy for companion context replay.
- Covers the compact model selector and how model options are presented to visitors.

## Domain Language

- **Project Guide Companion**: A site-owned chatbot companion that exposes Project Docs MCP-style document Q&A for durable project knowledge.
  _Avoid_: Agent Demo, Demo Catalog Entry, registry item

- **Companion Launcher**: The compact entry point that lets a visitor open the **Project Guide Companion** without taking over the current page.
  _Avoid_: Demo launcher, support widget, floating ad

- **Companion Greeting**: A short, visible message attached to the **Companion Launcher** that invites the visitor to ask about the project.
  _Avoid_: Hero copy, onboarding panel, notification

- **Companion Reveal**: A temporary **Companion Greeting** bubble that appears briefly near the **Companion Compass** and disappears when the visitor clicks elsewhere or closes it.
  _Avoid_: Entrance animation, persistent banner, modal

- **Companion Suggestion**: A short starter prompt that helps a visitor begin using the **Project Guide Companion**.
  _Avoid_: Capability boundary, fixed mode, canned answer

- **Companion Tool Line**: A compact one-line trace row that summarizes a Project Docs MCP tool call while the companion answers.
  _Avoid_: Raw tool card, debug trace, JSON dump

- **Companion Conversation**: Browser-session chat state for the **Project Guide Companion**, stored in `sessionStorage` for the first version.
  _Avoid_: Demo chat, account thread, server-side durable chat

- **Companion Context Window**: The time-bounded slice of a **Companion Conversation** sent as model context for the next answer.
  _Avoid_: Permanent memory, full transcript replay, trusted server state

- **Companion Compass**: The visual identity for the **Project Guide Companion**, presenting it as a small guide/wayfinding presence.
  _Avoid_: Robot mascot, customer-support avatar, generic chatbot bubble

## Current Subdomain Docs

- The **Project Guide Companion** is a published-site host feature, not an **Agent Demo**.
- The first version should live outside `registry/*` and outside any **Agent Demo** **Copy Boundary**.
- Keep the companion implementation in its own feature slice, currently `apps/web/features/project-guide-companion`, so it can evolve independently from homepage gallery code and demo workspace code.
- Use durable project knowledge as the answer source, especially `CONTEXT.md`, `docs/`, demo catalog metadata, and feature README files.
- Directly mirror the existing Project Docs MCP document function as the first capability boundary: list demo catalog entries, read durable docs for a demo slug, and search the project docs system for line-level matches.
- Treat Project Docs MCP and repository-source access as agent-only access. The visitor can receive that evidence only through the **Project Guide Companion**, so answers should translate retrieved evidence into a direct response and use file paths as citations or next steps.
- Treat homepage greetings and visible starter prompts as **Companion Suggestions** only. They should help visitors start with project-introduction questions, but they must not narrow what the companion can answer from Project Docs MCP evidence.
- Prefer the existing Project Docs MCP read/search/list capability as the first retrieval path. Do not require Vercel Sandbox for project-docs answers.
- Do not route companion API calls through `/api/demos/*`; the companion should not be counted or classified as a demo route. The first route is `/api/project-guide-companion`.
- Companion model-backed turns still consume the existing **Site Usage Gate** allowance. The usage dialog should watch `429` responses from `/api/project-guide-companion` in addition to `/api/demos/*`.
- Homepage strategy: show the companion prominently enough to greet first-time visitors and invite them to understand the project.
- On the homepage, default to a fixed bottom-right **Companion Compass** plus one short **Companion Reveal**. Open the chat panel only after the visitor clicks or taps.
- Do not rewrite the homepage into a chatbot-first landing page for the first version. The **Demo Gallery** remains the primary homepage structure.
- On desktop, open the companion as a bottom-right floating panel around 380-420px wide with a maximum height near 70vh.
- On mobile, open the companion as a bottom drawer so the chat remains usable on narrow screens.
- Registry guide strategy: show a collapsed **Companion Launcher** that can answer install-path and handoff questions without interrupting the guide.
- Demo workspace strategy: show only a small **Companion Launcher** so the active **Agent Demo** remains the primary interaction surface.
- Status and error page strategy: hide the companion unless a future support-oriented workflow is explicitly designed.
- Keep companion copy playful enough to feel pet-like, but preserve the repository's technical evaluator tone. The companion should help visitors choose what to inspect next instead of becoming generic small talk.
- Use **Companion Compass** as the visual identity. It should feel like a small wayfinding guide for the project, avoiding robot-mascot and customer-support-chatbot conventions.
- Keep the compass itself visually calm by default. Use brief pointer motion only on hover, click, or answer completion.
- Treat **Companion Reveal** as a temporary greeting bubble, not as an entrance animation. It should disappear when the visitor clicks outside it, opens the companion, or closes it.
- Show the homepage **Companion Reveal** at most once per browser session. Store the seen state in `sessionStorage` so normal route changes do not repeatedly greet the same visitor, while manual launcher clicks continue to work.
- Use `sessionStorage` as the first-version persistence carrier for **Companion Conversation** history. Do not add Postgres tables, Redis state, cleanup cron, or a history sidebar until the companion needs durable cross-tab or cross-session chat history.
- Keep the existing **Site Visitor Owner** identified by the `site_visitor_id` cookie as server-side usage and ownership infrastructure. The companion history MVP should not depend on client access to that cookie.
- Store only the visible companion transcript in `sessionStorage`: message id, role, creation time, text, and compact source chips. Do not store raw MCP JSON, expanded tool payloads, debug traces, credentials, or hidden server state in browser storage.
- Replay only a **Companion Context Window** into the model. The client should send only recent transcript entries, and the server should re-apply message-count, byte-size, and time-window caps before calling the model.
- Server-side **Companion Context Window** caps are 30 minutes, 12 visible text messages, and 16KB of projected message JSON.
- Treat client-sent **Companion Context Window** content as user-provided context, not trusted server history. Every grounded answer still needs fresh Project Docs MCP evidence.
- The **Companion Context Window** length is 30 minutes. The visible transcript may stay available until the browser tab session ends, but only the 30-minute window should be sent as model context.
- The model replay projection should keep user text, assistant answer text, and useful source summaries, while excluding raw MCP JSON and expanded tool payloads from history context.
- Provide a clear-history affordance inside the companion panel so visitors can discard tab-local context when the conversation drifts or the browser is shared.
- Expose a compact model selector in the composer footer. The default model is `zai/glm-5`, with `openai/gpt-4.1-mini` and `openai/gpt-5-mini` as selectable alternatives.
- Label selector options by model purpose, currently `chat` or `reasoning`, rather than latency or cost claims. Use measured performance or billing evidence before exposing those dimensions in the UI.
- Render Project Docs MCP tool use with a custom **Companion Tool Line**, not the full `mcp-agent` workspace `Tool` card.
- While a docs tool is running, show a single shimmering line such as a searching/reading status rather than an expanded parameter panel.
- After a docs tool completes, collapse the trace into a source-oriented line that names the relevant file paths, demo titles, or match count.
- A completed **Companion Tool Line** should default to one status phrase plus at most two source chips, such as `Searched docs`, `docs/frontend/project-guide-companion.md`, and `CONTEXT.md`.
- When more than two sources are relevant, show the extra sources only behind an explicit expand action so the compact companion panel does not become a debug console.
- Do not show raw MCP JSON as the default companion trace UI. The current MCP output shape wraps a JSON string inside `content[0].text`, so companion UI should parse that payload into readable source evidence before rendering.
- Keep any detailed tool payload behind an explicit secondary affordance if it is needed later. The default companion experience should read closer to Codex or Cursor inline activity than to a developer debug panel.

## Update Triggers

- Update this file when the companion's page visibility policy changes.
- Update this file when the companion becomes registry-distributed, demo-cataloged, or tied to a different project knowledge source.
- Update this file when the companion changes persistence carrier, context-window length, or client/server history ownership.
- Update this file when the companion default model or selectable model set changes.
- Update this file when model selector labeling changes.
